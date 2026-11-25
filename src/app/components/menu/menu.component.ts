import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalityService } from '../../services/hospitality.service';
import { RoleService } from '../../services/role.service';
import { MenuCategory, MenuItem } from '../../models/hospitality.model';
import { IconComponent } from '../shared/icon.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Menu & Recipe Engineering</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {{ hospitality.menuItems().length }} Active Items
            </span>
            <!-- Role badge -->
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
              [ngClass]="{
                'bg-blue-50 text-blue-900 border-blue-200': roleService.isChef(),
                'bg-amber-50 text-amber-900 border-amber-200': roleService.isWaiter(),
                'bg-emerald-50 text-emerald-900 border-emerald-200': roleService.isCashier(),
                'bg-purple-50 text-purple-900 border-purple-200': roleService.isManager()
              }">
              {{ roleService.currentUser().name }} ({{ roleService.currentRole() | uppercase }})
            </span>
          </div>
          <p class="text-sm text-slate-500 mt-0.5">
            @if (roleService.isChef()) {
              Chef Kitchen View · Instant 86 item / sold-out toggle when raw materials deplete. Pricing edits require Manager PIN (1234).
            } @else if (roleService.isWaiter()) {
              Captain Menu Guide · Read-only dietary & allergen handbook for guest queries. Pricing edits locked.
            } @else if (roleService.isCashier()) {
              Cashier Price Directory · POS pricing references and active discount status.
            } @else {
              Master Recipe Engineering · Configure prices, food cost margins, portions and outlet availability.
            }
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          @if (roleService.isChef()) {
            <button
              (click)="filterOnly86.set(!filterOnly86())"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer"
              [ngClass]="filterOnly86() ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'"
            >
              <span class="w-2 h-2 rounded-full" [ngClass]="filterOnly86() ? 'bg-white' : 'bg-rose-500'"></span>
              <span>{{ filterOnly86() ? 'Showing 86ed Dishes' : 'View 86 List (' + soldOutCount() + ')' }}</span>
            </button>
          }
          <button
            (click)="openAddItemModal()"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-sm cursor-pointer"
          >
            <app-icon name="plus" [size]="16" class="text-emerald-400"></app-icon>
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      <!-- Categories & Search Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Categories Pills -->
        <div class="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 overflow-x-auto">
          @for (c of categories; track c.id) {
            <button
              (click)="activeCategory.set(c.id)"
              class="px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
              [ngClass]="{ 'bg-white text-slate-900 shadow-xs': activeCategory() === c.id }"
            >
              {{ c.name }}
            </button>
          }
        </div>

        <!-- Search & Filter -->
        <div class="flex items-center gap-3">
          <div class="relative w-64">
            <app-icon name="search" [size]="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
            <input
              type="text"
              placeholder="Search dishes or recipes..."
              [(ngModel)]="searchQuery"
              class="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:outline-none"
            />
          </div>

          <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
            <input type="checkbox" [(ngModel)]="vegOnly" class="rounded text-emerald-600 focus:ring-0" />
            <span>Veg Only</span>
          </label>
        </div>
      </div>

      <!-- Items Table -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th class="px-5 py-3.5">Item & Visual</th>
                <th class="px-5 py-3.5">Category</th>
                <th class="px-5 py-3.5">Selling Price</th>
                <th class="px-5 py-3.5">Food Cost & Margin</th>
                <th class="px-5 py-3.5">Preparation Time</th>
                <th class="px-5 py-3.5">Availability</th>
                <th class="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (item of filteredItems(); track item.id) {
                <tr class="hover:bg-slate-50/60 transition-colors">
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-3">
                      <img [src]="item.image" [alt]="item.name" class="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs" />
                      <div>
                        <div class="font-bold text-slate-900 flex items-center gap-1.5">
                          <span class="w-2.5 h-2.5 rounded-full" [ngClass]="item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                          {{ item.name }}
                          @if (item.isBestseller) {
                            <span class="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">Bestseller</span>
                          }
                        </div>
                        <p class="text-[11px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">{{ item.description }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-3.5">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-100 text-slate-700">
                      {{ item.category }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5 font-bold text-slate-900 text-sm">
                    ₹{{ item.price }}
                    @if (item.variants && item.variants.length > 0) {
                      <span class="text-[10px] text-slate-400 font-normal block">{{ item.variants.length }} portions</span>
                    }
                  </td>
                  <td class="px-5 py-3.5">
                    <div class="font-semibold text-slate-800">Cost: ₹{{ item.costPrice }}</div>
                    <div class="text-[11px] text-emerald-600 font-bold">
                      {{ calculateMargin(item) }}% Gross Margin
                    </div>
                  </td>
                  <td class="px-5 py-3.5 font-medium text-slate-700">
                    ⏱️ {{ item.preparationTime }} mins
                  </td>
                  <td class="px-5 py-3.5">
                    <button
                      (click)="hospitality.toggleItemAvailability(item.id)"
                      class="px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5"
                      [ngClass]="item.isAvailable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="item.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                      {{ item.isAvailable ? 'In Stock (Live)' : 'Sold Out' }}
                    </button>
                  </td>
                  <td class="px-5 py-3.5 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        (click)="openEditModal(item)"
                        class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        title="Edit Item"
                      >
                        <app-icon name="edit" [size]="14"></app-icon>
                      </button>
                      <button
                        (click)="deleteItem(item)"
                        class="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                        title="Delete Item"
                      >
                        <app-icon name="trash" [size]="14"></app-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- ADD / EDIT MENU ITEM MODAL -->
      @if (showItemModal()) {
        <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 class="text-base font-bold text-slate-900">
                {{ editingItem() ? 'Edit Dish: ' + editingItem()!.name : 'Add New Menu Item' }}
              </h3>
              <button (click)="showItemModal.set(false)" class="text-slate-400 hover:text-slate-600">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <div class="space-y-4 my-4">
              <div>
                <label class="font-semibold text-slate-700 block mb-1">Dish Name</label>
                <input type="text" [(ngModel)]="formName" placeholder="e.g. Saffron Malai Kofta" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Category</label>
                  <select [(ngModel)]="formCategory" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <option value="starters">Starters</option>
                    <option value="main-course">Main Course</option>
                    <option value="pizza">Pizza</option>
                    <option value="burgers">Burgers</option>
                    <option value="beverages">Beverages</option>
                    <option value="desserts">Desserts</option>
                  </select>
                </div>
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Dietary Type</label>
                  <select [(ngModel)]="formIsVeg" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <option [ngValue]="true">🟢 Pure Vegetarian</option>
                    <option [ngValue]="false">🔴 Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Menu Price (₹)</label>
                  <input type="number" [(ngModel)]="formPrice" min="0" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 font-bold" />
                </div>
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Cost of Goods (₹)</label>
                  <input type="number" [(ngModel)]="formCost" min="0" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label class="font-semibold text-slate-700 block mb-1">Prep Time (mins)</label>
                  <input type="number" [(ngModel)]="formPrepTime" min="1" class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
                </div>
              </div>

              <div>
                <label class="font-semibold text-slate-700 block mb-1">Photo Image URL</label>
                <input type="text" [(ngModel)]="formImage" placeholder="https://images.unsplash.com/..." class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200" />
                @if (formImage) {
                  <div class="mt-2 flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <img [src]="formImage" class="w-12 h-12 rounded-lg object-cover" />
                    <span class="text-[11px] text-slate-500">Image thumbnail preview</span>
                  </div>
                }
              </div>

              <div>
                <label class="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea rows="2" [(ngModel)]="formDescription" placeholder="Succulent dish cooked with traditional spices..." class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200"></textarea>
              </div>

              <div class="flex items-center gap-4 pt-1">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="formBestseller" class="rounded text-amber-500 focus:ring-0" />
                  <span class="font-semibold text-slate-800">Mark as Bestseller ★</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="formAvailable" class="rounded text-emerald-600 focus:ring-0" />
                  <span class="font-semibold text-slate-800">Available across all outlets</span>
                </label>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                (click)="showItemModal.set(false)"
                class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                (click)="saveMenuItem()"
                class="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class MenuComponent {
  public hospitality = inject(HospitalityService);
  public roleService = inject(RoleService);
  private toast = inject(ToastService);

  activeCategory = signal<MenuCategory>('all');
  searchQuery = '';
  vegOnly = false;
  filterOnly86 = signal(false);

  showItemModal = signal(false);
  editingItem = signal<MenuItem | null>(null);

  // Form bindings
  formName = '';
  formCategory: MenuCategory = 'starters';
  formPrice = 280;
  formCost = 90;
  formPrepTime = 15;
  formImage = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80';
  formDescription = '';
  formIsVeg = true;
  formBestseller = false;
  formAvailable = true;

  readonly categories: { id: MenuCategory; name: string }[] = [
    { id: 'all', name: 'All Dishes' },
    { id: 'starters', name: 'Starters' },
    { id: 'main-course', name: 'Main Course' },
    { id: 'pizza', name: 'Pizza' },
    { id: 'burgers', name: 'Burgers' },
    { id: 'beverages', name: 'Beverages' },
    { id: 'desserts', name: 'Desserts' },
  ];

  readonly soldOutCount = computed(() => {
    return this.hospitality.menuItems().filter((i) => !i.isAvailable).length;
  });

  readonly filteredItems = computed(() => {
    const cat = this.activeCategory();
    const q = this.searchQuery.toLowerCase().trim();
    const veg = this.vegOnly;
    const only86 = this.filterOnly86();

    return this.hospitality.menuItems().filter((item) => {
      if (only86 && item.isAvailable) return false;
      if (cat !== 'all' && item.category !== cat) return false;
      if (veg && !item.isVeg) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    });
  });

  calculateMargin(item: MenuItem): number {
    if (!item.price || item.price <= 0) return 0;
    return Math.round(((item.price - item.costPrice) / item.price) * 100);
  }

  openAddItemModal() {
    if (this.roleService.isManager()) {
      this.doOpenAddItemModal();
    } else {
      // PetPooja role constraint: Adding menu items restricted to Manager PIN
      this.roleService.requestManagerPin('Create New Menu Item', () => {
        this.doOpenAddItemModal();
      });
    }
  }

  private doOpenAddItemModal() {
    this.editingItem.set(null);
    this.formName = '';
    this.formCategory = 'main-course';
    this.formPrice = 290;
    this.formCost = 95;
    this.formPrepTime = 16;
    this.formImage = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80';
    this.formDescription = 'Signature chef specialty prepared with royal Rajasthani ingredients.';
    this.formIsVeg = true;
    this.formBestseller = true;
    this.formAvailable = true;
    this.showItemModal.set(true);
  }

  openEditModal(item: MenuItem) {
    if (this.roleService.isManager()) {
      this.doOpenEditModal(item);
    } else {
      // PetPooja role constraint: Changing menu prices requires General Manager PIN
      this.roleService.requestManagerPin(`Edit Price/Recipe [${item.name}]`, () => {
        this.doOpenEditModal(item);
      });
    }
  }

  private doOpenEditModal(item: MenuItem) {
    this.editingItem.set(item);
    this.formName = item.name;
    this.formCategory = item.category;
    this.formPrice = item.price;
    this.formCost = item.costPrice;
    this.formPrepTime = item.preparationTime;
    this.formImage = item.image;
    this.formDescription = item.description;
    this.formIsVeg = item.isVeg;
    this.formBestseller = !!item.isBestseller;
    this.formAvailable = item.isAvailable;
    this.showItemModal.set(true);
  }

  saveMenuItem() {
    if (!this.formName) {
      this.toast.error('Validation Error', 'Dish name is required');
      return;
    }

    if (this.editingItem()) {
      this.hospitality.updateMenuItem({
        ...this.editingItem()!,
        name: this.formName,
        category: this.formCategory,
        price: this.formPrice,
        costPrice: this.formCost,
        preparationTime: this.formPrepTime,
        image: this.formImage,
        description: this.formDescription,
        isVeg: this.formIsVeg,
        isBestseller: this.formBestseller,
        isAvailable: this.formAvailable,
      });
    } else {
      this.hospitality.addMenuItem({
        name: this.formName,
        category: this.formCategory,
        price: this.formPrice,
        costPrice: this.formCost,
        preparationTime: this.formPrepTime,
        image: this.formImage,
        description: this.formDescription,
        isVeg: this.formIsVeg,
        isBestseller: this.formBestseller,
        isAvailable: this.formAvailable,
        outletsAvailable: ['jaipur-central', 'malviya-nagar', 'vaishali-nagar'],
      });
    }

    this.showItemModal.set(false);
  }

  deleteItem(item: MenuItem) {
    if (this.roleService.isManager()) {
      if (confirm(`Remove ${item.name} from menu?`)) {
        this.hospitality.deleteMenuItem(item.id);
      }
    } else {
      // PetPooja role constraint: Menu deletion requires Manager authorization
      this.roleService.requestManagerPin(`Delete Item [${item.name}]`, () => {
        this.hospitality.deleteMenuItem(item.id);
      });
    }
  }
}
