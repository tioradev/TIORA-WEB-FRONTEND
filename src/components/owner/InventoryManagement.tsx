import React, { useState } from 'react';
import { 
  Package, Plus, Search, Filter, AlertTriangle, 
  TrendingDown, TrendingUp, Edit, Trash2, Eye,
  Truck, Calendar, DollarSign, BarChart3, X
} from 'lucide-react';
import { InventoryItem, Supplier, StockAlert } from '../../types';

const InventoryManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'suppliers' | 'alerts' | 'analytics'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showItemDetails, setShowItemDetails] = useState(false);

  // Mock data
  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: '1',
      salonId: 'salon1',
      name: 'Professional Shampoo',
      category: 'shampoo',
      brand: 'L\'Oreal',
      sku: 'LOR-SH-001',
      currentStock: 15,
      minStockLevel: 10,
      maxStockLevel: 50,
      unitPrice: 25.99,
      supplierId: 'sup1',
      supplierName: 'Beauty Supply Co',
      lastRestocked: new Date('2024-01-10'),
      expiryDate: new Date('2025-01-10'),
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2024-01-10'),
    },
    {
      id: '2',
      salonId: 'salon1',
      name: 'Hair Cutting Scissors',
      category: 'tools',
      brand: 'Jaguar',
      sku: 'JAG-SC-002',
      currentStock: 3,
      minStockLevel: 5,
      maxStockLevel: 15,
      unitPrice: 89.99,
      supplierId: 'sup2',
      supplierName: 'Professional Tools Ltd',
      lastRestocked: new Date('2023-12-15'),
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-12-15'),
    },
  ]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: 'sup1',
      salonId: 'salon1',
      name: 'Beauty Supply Co',
      contactPerson: 'John Smith',
      email: 'john@beautysupply.com',
      phone: '+1234567890',
      address: '123 Supply Street, City, State 12345',
      paymentTerms: 'Net 30',
      isActive: true,
      rating: 4.5,
      createdAt: new Date('2023-01-01'),
    },
    {
      id: 'sup2',
      salonId: 'salon1',
      name: 'Professional Tools Ltd',
      contactPerson: 'Sarah Johnson',
      email: 'sarah@protools.com',
      phone: '+1234567891',
      address: '456 Tool Avenue, City, State 12345',
      paymentTerms: 'Net 15',
      isActive: true,
      rating: 4.8,
      createdAt: new Date('2023-01-01'),
    },
  ]);

  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([
    {
      id: '1',
      salonId: 'salon1',
      itemId: '2',
      itemName: 'Hair Cutting Scissors',
      currentStock: 3,
      minStockLevel: 5,
      alertType: 'low-stock',
      createdAt: new Date(),
      isResolved: false,
    },
  ]);

  const categories = [
    { value: 'shampoo', label: 'Shampoo' },
    { value: 'conditioner', label: 'Conditioner' },
    { value: 'styling-product', label: 'Styling Products' },
    { value: 'tools', label: 'Tools' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'other', label: 'Other' },
  ];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return { status: 'out-of-stock', color: 'bg-red-100 text-red-800' };
    if (item.currentStock <= item.minStockLevel) return { status: 'low-stock', color: 'bg-amber-100 text-amber-800' };
    return { status: 'in-stock', color: 'bg-green-100 text-green-800' };
  };

  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);
  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStockLevel).length;

  // Button Functions
  const handleAddItem = (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setInventory([...inventory, newItem]);
    setShowAddModal(false);
    
    // Check if this creates a new alert
    if (newItem.currentStock <= newItem.minStockLevel) {
      const newAlert: StockAlert = {
        id: Date.now().toString(),
        salonId: newItem.salonId,
        itemId: newItem.id,
        itemName: newItem.name,
        currentStock: newItem.currentStock,
        minStockLevel: newItem.minStockLevel,
        alertType: newItem.currentStock === 0 ? 'out-of-stock' : 'low-stock',
        createdAt: new Date(),
        isResolved: false,
      };
      setStockAlerts([...stockAlerts, newAlert]);
    }
  };

  const handleEditItem = (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingItem) {
      setInventory(inventory.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...itemData, updatedAt: new Date() }
          : item
      ));
      setEditingItem(null);
      setShowAddModal(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setInventory(inventory.filter(item => item.id !== itemId));
      setStockAlerts(stockAlerts.filter(alert => alert.itemId !== itemId));
    }
  };

  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowItemDetails(true);
  };

  const handleReorder = (alertId: string) => {
    const alert = stockAlerts.find(a => a.id === alertId);
    if (alert) {
      // Mock reorder process
      const item = inventory.find(i => i.id === alert.itemId);
      if (item) {
        const reorderQuantity = item.maxStockLevel - item.currentStock;
        setInventory(inventory.map(i => 
          i.id === item.id 
            ? { ...i, currentStock: item.maxStockLevel, lastRestocked: new Date() }
            : i
        ));
        
        // Resolve the alert
        setStockAlerts(stockAlerts.map(a => 
          a.id === alertId ? { ...a, isResolved: true } : a
        ));
        
        alert(`Reordered ${reorderQuantity} units of ${item.name}`);
      }
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setStockAlerts(stockAlerts.map(alert => 
      alert.id === alertId ? { ...alert, isResolved: true } : alert
    ));
  };

  const handleAddSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setSuppliers([...suppliers, newSupplier]);
    setShowSupplierModal(false);
  };

  const handleEditSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt'>) => {
    if (editingSupplier) {
      setSuppliers(suppliers.map(supplier => 
        supplier.id === editingSupplier.id 
          ? { ...supplier, ...supplierData }
          : supplier
      ));
      setEditingSupplier(null);
      setShowSupplierModal(false);
    }
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (window.confirm('Are you sure you want to remove this supplier?')) {
      setSuppliers(suppliers.filter(supplier => supplier.id !== supplierId));
    }
  };

  const tabs = [
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'alerts', label: 'Stock Alerts', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-600">Track products, manage suppliers, and monitor stock levels</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">${totalInventoryValue.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockItems}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{suppliers.filter(s => s.isActive).length}</p>
            </div>
            <Truck className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <div className="flex space-x-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map((item) => {
                    const stockStatus = getStockStatus(item);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.brand} • {item.sku}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.currentStock}</div>
                          <div className="text-sm text-gray-500">Min: {item.minStockLevel}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${item.unitPrice}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(item.currentStock * item.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.supplierName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                            {stockStatus.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewItem(item)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingItem(item);
                                setShowAddModal(true);
                              }}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Suppliers</h3>
            <button
              onClick={() => setShowSupplierModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white hover:bg-purple-600 rounded-lg transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                    <p className="text-sm text-gray-600">{supplier.contactPerson}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-xs ${i < supplier.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p>{supplier.email}</p>
                  <p>{supplier.phone}</p>
                  <p>{supplier.address}</p>
                  <p><span className="font-medium">Payment Terms:</span> {supplier.paymentTerms}</p>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <button 
                    onClick={() => {
                      setEditingSupplier(supplier);
                      setShowSupplierModal(true);
                    }}
                    className="flex-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 text-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteSupplier(supplier.id)}
                    className="flex-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {stockAlerts.filter(alert => !alert.isResolved).length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No stock alerts at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stockAlerts.filter(alert => !alert.isResolved).map((alert) => (
                <div key={alert.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        alert.alertType === 'out-of-stock' ? 'bg-red-100' : 'bg-amber-100'
                      }`}>
                        <AlertTriangle className={`w-6 h-6 ${
                          alert.alertType === 'out-of-stock' ? 'text-red-600' : 'text-amber-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{alert.itemName}</h3>
                        <p className="text-sm text-gray-600">
                          Current stock: {alert.currentStock} | Minimum: {alert.minStockLevel}
                        </p>
                        <p className="text-xs text-gray-500">
                          {alert.createdAt.toLocaleDateString()} at {alert.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleReorder(alert.id)}
                        className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors duration-200 text-sm"
                      >
                        Reorder
                      </button>
                      <button 
                        onClick={() => handleDismissAlert(alert.id)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 text-sm"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Turnover</h3>
              <div className="space-y-4">
                {categories.slice(0, 4).map((category, index) => (
                  <div key={category.value} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{category.label}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${Math.random() * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{(Math.random() * 10).toFixed(1)}x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Inventory Cost</span>
                  <span className="font-semibold text-gray-900">${totalInventoryValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Usage Cost</span>
                  <span className="font-semibold text-gray-900">${(totalInventoryValue * 0.3).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Waste/Expired</span>
                  <span className="font-semibold text-red-600">${(totalInventoryValue * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-900">Net Efficiency</span>
                  <span className="font-semibold text-green-600">95%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {showAddModal && (
        <ItemModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
          onSave={editingItem ? handleEditItem : handleAddItem}
          editingItem={editingItem}
          suppliers={suppliers}
          categories={categories}
        />
      )}

      {/* Add/Edit Supplier Modal */}
      {showSupplierModal && (
        <SupplierModal
          isOpen={showSupplierModal}
          onClose={() => {
            setShowSupplierModal(false);
            setEditingSupplier(null);
          }}
          onSave={editingSupplier ? handleEditSupplier : handleAddSupplier}
          editingSupplier={editingSupplier}
        />
      )}

      {/* Item Details Modal */}
      {showItemDetails && selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          onClose={() => {
            setShowItemDetails(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
};

// Item Modal Component
interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingItem: InventoryItem | null;
  suppliers: Supplier[];
  categories: Array<{ value: string; label: string }>;
}

const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, onSave, editingItem, suppliers, categories }) => {
  const [formData, setFormData] = useState({
    salonId: editingItem?.salonId || 'salon1',
    name: editingItem?.name || '',
    category: editingItem?.category || 'other',
    brand: editingItem?.brand || '',
    sku: editingItem?.sku || '',
    currentStock: editingItem?.currentStock || 0,
    minStockLevel: editingItem?.minStockLevel || 0,
    maxStockLevel: editingItem?.maxStockLevel || 0,
    unitPrice: editingItem?.unitPrice || 0,
    supplierId: editingItem?.supplierId || '',
    supplierName: editingItem?.supplierName || '',
    expiryDate: editingItem?.expiryDate || undefined,
    isActive: editingItem?.isActive ?? true,
    lastRestocked: editingItem?.lastRestocked || new Date(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);
    onSave({
      ...formData,
      supplierName: selectedSupplier?.name || formData.supplierName,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
              <input
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="0"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
              <input
                type="number"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="0"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock Level</label>
              <input
                type="number"
                value={formData.maxStockLevel}
                onChange={(e) => setFormData({ ...formData, maxStockLevel: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
              <input
                type="number"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
            <input
              type="date"
              value={formData.expiryDate ? formData.expiryDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                expiryDate: e.target.value ? new Date(e.target.value) : undefined 
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all duration-200"
            >
              {editingItem ? 'Update' : 'Add'} Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Supplier Modal Component
interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  editingSupplier: Supplier | null;
}

const SupplierModal: React.FC<SupplierModalProps> = ({ isOpen, onClose, onSave, editingSupplier }) => {
  const [formData, setFormData] = useState({
    salonId: editingSupplier?.salonId || 'salon1',
    name: editingSupplier?.name || '',
    contactPerson: editingSupplier?.contactPerson || '',
    email: editingSupplier?.email || '',
    phone: editingSupplier?.phone || '',
    address: editingSupplier?.address || '',
    paymentTerms: editingSupplier?.paymentTerms || 'Net 30',
    isActive: editingSupplier?.isActive ?? true,
    rating: editingSupplier?.rating || 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
            <select
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 60">Net 60</option>
              <option value="COD">Cash on Delivery</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all duration-200"
            >
              {editingSupplier ? 'Update' : 'Add'} Supplier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Item Details Modal Component
interface ItemDetailsModalProps {
  item: InventoryItem;
  onClose: () => void;
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ item, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Item Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 text-lg">{item.name}</h4>
            <p className="text-gray-600">{item.brand} • {item.sku}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Current Stock</p>
              <p className="font-semibold text-gray-900">{item.currentStock}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Unit Price</p>
              <p className="font-semibold text-gray-900">${item.unitPrice}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="font-semibold text-gray-900">${(item.currentStock * item.unitPrice).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Supplier</p>
              <p className="font-semibold text-gray-900">{item.supplierName}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600">Stock Levels</p>
            <div className="flex justify-between text-sm">
              <span>Min: {item.minStockLevel}</span>
              <span>Current: {item.currentStock}</span>
              <span>Max: {item.maxStockLevel}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-purple-500 h-2 rounded-full" 
                style={{ width: `${(item.currentStock / item.maxStockLevel) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Last Restocked</p>
              <p className="font-semibold text-gray-900">{item.lastRestocked.toLocaleDateString()}</p>
            </div>
            {item.expiryDate && (
              <div>
                <p className="text-sm text-gray-600">Expiry Date</p>
                <p className="font-semibold text-gray-900">{item.expiryDate.toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;