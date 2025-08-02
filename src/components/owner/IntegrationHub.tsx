import React, { useState } from 'react';
import { Zap, Settings, CheckCircle, AlertTriangle, Calendar, CreditCard, BarChart3, Share2, Plus, Search, Filter, RefreshCw as Refresh, ExternalLink, X } from 'lucide-react';
import { Integration } from '../../types';

const IntegrationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'connected' | 'available' | 'settings'>('connected');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);

  // Mock data
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: '1',
      salonId: 'salon1',
      type: 'pos',
      name: 'Square POS',
      isActive: true,
      lastSync: new Date('2024-01-15T10:30:00'),
      syncStatus: 'success',
      settings: {
        autoSync: true,
        syncInterval: 'hourly',
        syncTransactions: true,
        syncInventory: false,
      },
    },
    {
      id: '2',
      salonId: 'salon1',
      type: 'accounting',
      name: 'QuickBooks Online',
      isActive: true,
      lastSync: new Date('2024-01-15T09:15:00'),
      syncStatus: 'success',
      settings: {
        autoSync: true,
        syncInterval: 'daily',
        syncExpenses: true,
        syncRevenue: true,
      },
    },
    {
      id: '3',
      salonId: 'salon1',
      type: 'calendar',
      name: 'Google Calendar',
      isActive: false,
      syncStatus: 'failed',
      settings: {
        autoSync: false,
        syncAppointments: true,
        syncStaffSchedule: true,
      },
    },
  ]);

  const availableIntegrations = [
    {
      name: 'Stripe',
      type: 'pos',
      description: 'Accept payments and manage transactions',
      category: 'Payment Processing',
      features: ['Online payments', 'Recurring billing', 'Analytics'],
      pricing: '2.9% + 30¢ per transaction',
      logo: '💳',
    },
    {
      name: 'Mailchimp',
      type: 'marketing',
      description: 'Email marketing and automation',
      category: 'Marketing',
      features: ['Email campaigns', 'Automation', 'Analytics'],
      pricing: 'Free up to 2,000 contacts',
      logo: '📧',
    },
    {
      name: 'Instagram Business',
      type: 'social-media',
      description: 'Showcase your work and engage customers',
      category: 'Social Media',
      features: ['Post scheduling', 'Analytics', 'Direct booking'],
      pricing: 'Free',
      logo: '📸',
    },
    {
      name: 'Xero',
      type: 'accounting',
      description: 'Cloud-based accounting software',
      category: 'Accounting',
      features: ['Invoicing', 'Expense tracking', 'Financial reports'],
      pricing: 'Starting at $13/month',
      logo: '📊',
    },
    {
      name: 'Outlook Calendar',
      type: 'calendar',
      description: 'Sync appointments with Outlook',
      category: 'Calendar',
      features: ['Two-way sync', 'Meeting reminders', 'Availability'],
      pricing: 'Free with Office 365',
      logo: '📅',
    },
    {
      name: 'Yelp for Business',
      type: 'review-platform',
      description: 'Manage your Yelp presence',
      category: 'Reviews',
      features: ['Review management', 'Business insights', 'Customer messaging'],
      pricing: 'Free',
      logo: '⭐',
    },
  ];

  const tabs = [
    { id: 'connected', label: 'Connected', icon: CheckCircle },
    { id: 'available', label: 'Available', icon: Plus },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Button Functions
  const handleConnectIntegration = (integration: any) => {
    const newIntegration: Integration = {
      id: Date.now().toString(),
      salonId: 'salon1',
      type: integration.type,
      name: integration.name,
      isActive: true,
      lastSync: new Date(),
      syncStatus: 'success',
      settings: {
        autoSync: true,
        syncInterval: 'daily',
      },
    };
    
    setIntegrations([...integrations, newIntegration]);
    setShowConnectModal(false);
    setSelectedIntegration(null);
    alert(`${integration.name} connected successfully!`);
  };

  const handleDisconnectIntegration = (integrationId: string) => {
    if (window.confirm('Are you sure you want to disconnect this integration?')) {
      setIntegrations(integrations.filter(integration => integration.id !== integrationId));
    }
  };

  const handleToggleIntegration = (integrationId: string) => {
    setIntegrations(integrations.map(integration =>
      integration.id === integrationId
        ? { ...integration, isActive: !integration.isActive }
        : integration
    ));
  };

  const handleSyncNow = (integrationId: string) => {
    setIntegrations(integrations.map(integration =>
      integration.id === integrationId
        ? { 
            ...integration, 
            syncStatus: 'pending',
            lastSync: new Date()
          }
        : integration
    ));

    // Simulate sync completion
    setTimeout(() => {
      setIntegrations(prev => prev.map(integration =>
        integration.id === integrationId
          ? { ...integration, syncStatus: 'success' }
          : integration
      ));
      alert('Sync completed successfully!');
    }, 2000);
  };

  const handleConfigureIntegration = (integration: Integration) => {
    alert(`Opening configuration for ${integration.name}`);
  };

  const handleViewDetails = (integration: any) => {
    alert(`Viewing details for ${integration.name}\n\nFeatures:\n${integration.features.join('\n')}\n\nPricing: ${integration.pricing}`);
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      case 'pending': return <Refresh className="w-4 h-4 animate-spin" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'pos': return <CreditCard className="w-6 h-6" />;
      case 'accounting': return <BarChart3 className="w-6 h-6" />;
      case 'calendar': return <Calendar className="w-6 h-6" />;
      case 'social-media': return <Share2 className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integration Hub</h2>
          <p className="text-gray-600">Connect your salon with external services and platforms</p>
        </div>
        <button 
          onClick={() => setActiveTab('available')}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Integration</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Connected</p>
              <p className="text-2xl font-bold text-gray-900">{integrations.filter(i => i.isActive).length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">{availableIntegrations.length}</p>
            </div>
            <Plus className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sync Status</p>
              <p className="text-2xl font-bold text-gray-900">
                {integrations.filter(i => i.syncStatus === 'success').length}/{integrations.filter(i => i.isActive).length}
              </p>
            </div>
            <Refresh className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Sync</p>
              <p className="text-lg font-bold text-gray-900">
                {integrations.filter(i => i.lastSync).length > 0 
                  ? Math.max(...integrations.filter(i => i.lastSync).map(i => i.lastSync!.getTime())) > Date.now() - 60000 
                    ? 'Just now' 
                    : '5 min ago'
                  : 'Never'
                }
              </p>
            </div>
            <Calendar className="w-8 h-8 text-amber-500" />
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

      {/* Connected Integrations Tab */}
      {activeTab === 'connected' && (
        <div className="space-y-6">
          {integrations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No integrations connected yet</p>
              <button
                onClick={() => setActiveTab('available')}
                className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200"
              >
                Browse Available Integrations
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {integrations.map((integration) => (
                <div key={integration.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        {getIntegrationIcon(integration.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">{integration.type.replace('-', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-1 ${getSyncStatusColor(integration.syncStatus)}`}>
                        {getSyncStatusIcon(integration.syncStatus)}
                        <span className="text-sm font-medium">
                          {integration.syncStatus.charAt(0).toUpperCase() + integration.syncStatus.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        integration.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {integration.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {integration.lastSync && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Last Sync</span>
                        <span className="text-sm text-gray-900">
                          {integration.lastSync.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleIntegration(integration.id)}
                      className={`flex-1 px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${
                        integration.isActive
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {integration.isActive ? 'Disconnect' : 'Connect'}
                    </button>
                    
                    {integration.isActive && (
                      <button
                        onClick={() => handleSyncNow(integration.id)}
                        className="flex-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 text-sm"
                      >
                        Sync Now
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleConfigureIntegration(integration)}
                      className="flex-1 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200 text-sm"
                    >
                      Settings
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Available Integrations Tab */}
      {activeTab === 'available' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Available Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableIntegrations
              .filter(integration => 
                integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                integration.category.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((integration, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="text-3xl">{integration.logo}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                      <p className="text-sm text-gray-600">{integration.category}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

                  <div className="space-y-3 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {integration.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Pricing</h4>
                      <p className="text-sm text-gray-600">{integration.pricing}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        setSelectedIntegration(integration);
                        setShowConnectModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-purple-500 text-white hover:bg-purple-600 rounded-lg transition-colors duration-200 text-sm"
                    >
                      Connect
                    </button>
                    <button 
                      onClick={() => handleViewDetails(integration)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Integration Settings</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Sync Preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700">Auto-sync enabled</p>
                      <p className="text-sm text-gray-600">Automatically sync data with connected services</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700">Real-time notifications</p>
                      <p className="text-sm text-gray-600">Get notified when sync operations complete</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700">Error notifications</p>
                      <p className="text-sm text-gray-600">Get notified when sync operations fail</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Data Retention</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sync history retention</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                      <option value="180">6 months</option>
                      <option value="365">1 year</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Error log retention</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button 
                  onClick={() => alert('Settings saved successfully!')}
                  className="px-6 py-3 bg-purple-500 text-white hover:bg-purple-600 rounded-lg transition-colors duration-200"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connect Integration Modal */}
      {showConnectModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Connect {selectedIntegration.name}</h3>
              <button 
                onClick={() => {
                  setShowConnectModal(false);
                  setSelectedIntegration(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">{selectedIntegration.logo}</div>
                <h4 className="text-lg font-semibold text-gray-900">{selectedIntegration.name}</h4>
                <p className="text-gray-600">{selectedIntegration.description}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">What you'll get:</h5>
                  <ul className="space-y-1">
                    {selectedIntegration.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Pricing:</span> {selectedIntegration.pricing}
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowConnectModal(false);
                    setSelectedIntegration(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConnectIntegration(selectedIntegration)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all duration-200"
                >
                  Connect Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationHub;