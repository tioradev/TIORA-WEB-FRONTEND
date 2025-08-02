import React, { useState } from 'react';
import { 
  Settings, Shield, Bell, 
  Palette, Clock,
  Save, RefreshCw, X,
  DollarSign
} from 'lucide-react';
import { mockSalons } from '../../data/mockData';

interface SystemSettingsState {
  general: {
    companyName: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    language: string;
    maintenanceMode: boolean;
    systemVersion: string;
  };
  security: {
    passwordMinLength: number;
    requireSpecialChars: boolean;
    requireNumbers: boolean;
    requireUppercase: boolean;
    sessionTimeout: number;
    twoFactorAuth: boolean;
    loginAttempts: number;
    ipWhitelist: string[];
    encryptionLevel: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    appointmentReminders: boolean;
    paymentAlerts: boolean;
    systemAlerts: boolean;
    marketingEmails: boolean;
  };
  business: {
    workingDays: string[];
    defaultOpenTime: string;
    defaultCloseTime: string;
    appointmentSlotDuration: number;
    advanceBookingDays: number;
    cancellationPolicy: string;
    noShowPolicy: string;
  };
  appearance: {
    theme: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    favicon: string;
    customCSS: string;
    fontFamily: string;
  };
  appointmentCharging: {
    chargePerAppointment: number;
    dailySchedulerTime: string;
    autoChargeEnabled: boolean;
    sendPaymentNotifications: boolean;
    currency: string;
    processingFee: number;
  };
}

interface SalonColorConfig {
  salonId: string;
  salonName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
}

const SalonColorsConfiguration: React.FC = () => {
  const [selectedSalon, setSelectedSalon] = useState<string>('');
  const [salonColors, setSalonColors] = useState<SalonColorConfig[]>([
    {
      salonId: 'salon1',
      salonName: 'Elite Hair Studio',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      accentColor: '#10b981',
      backgroundColor: '#f8fafc',
      textColor: '#1f2937',
      isActive: true,
    },
    {
      salonId: 'salon2',
      salonName: 'Urban Cuts',
      primaryColor: '#ef4444',
      secondaryColor: '#f59e0b',
      accentColor: '#06b6d4',
      backgroundColor: '#fefefe',
      textColor: '#111827',
      isActive: true,
    },
  ]);

  const [currentConfig, setCurrentConfig] = useState<SalonColorConfig>({
    salonId: '',
    salonName: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    accentColor: '#10b981',
    backgroundColor: '#f8fafc',
    textColor: '#1f2937',
    isActive: true,
  });

  const handleSalonSelect = (salonId: string) => {
    setSelectedSalon(salonId);
    const salon = mockSalons.find(s => s.id === salonId);
    const existingConfig = salonColors.find(c => c.salonId === salonId);
    
    if (existingConfig) {
      setCurrentConfig(existingConfig);
    } else {
      setCurrentConfig({
        salonId,
        salonName: salon?.name || '',
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        accentColor: '#10b981',
        backgroundColor: '#f8fafc',
        textColor: '#1f2937',
        isActive: true,
      });
    }
  };

  const handleColorChange = (field: keyof SalonColorConfig, value: string) => {
    setCurrentConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveColors = () => {
    if (!selectedSalon) {
      alert('Please select a salon first');
      return;
    }

    const existingIndex = salonColors.findIndex(c => c.salonId === selectedSalon);
    
    if (existingIndex >= 0) {
      // Update existing configuration
      const updatedColors = [...salonColors];
      updatedColors[existingIndex] = currentConfig;
      setSalonColors(updatedColors);
    } else {
      // Add new configuration
      setSalonColors([...salonColors, currentConfig]);
    }
    
    alert(`Color configuration saved for ${currentConfig.salonName}!`);
  };

  const resetToDefault = () => {
    setCurrentConfig({
      ...currentConfig,
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      accentColor: '#10b981',
      backgroundColor: '#f8fafc',
      textColor: '#1f2937',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
          <Palette className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Salon Color Configuration</h3>
      </div>

      {/* Salon Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-4">Select Salon</h4>
        <select
          value={selectedSalon}
          onChange={(e) => handleSalonSelect(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        >
          <option value="">Choose a salon to configure</option>
          {mockSalons.map(salon => (
            <option key={salon.id} value={salon.id}>
              {salon.name} - {salon.city}
            </option>
          ))}
        </select>
      </div>

      {selectedSalon && (
        <>
          {/* Color Configuration */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-medium text-gray-900">Color Configuration for {currentConfig.salonName}</h4>
              <button
                onClick={resetToDefault}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Reset to Default
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={currentConfig.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className="w-16 h-12 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={currentConfig.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Main brand color for buttons and highlights</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={currentConfig.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className="w-16 h-12 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={currentConfig.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Secondary brand color for gradients</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={currentConfig.accentColor}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    className="w-16 h-12 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={currentConfig.accentColor}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Accent color for success states and highlights</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={currentConfig.backgroundColor}
                    onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                    className="w-16 h-12 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={currentConfig.backgroundColor}
                    onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Main background color for the interface</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={currentConfig.textColor}
                    onChange={(e) => handleColorChange('textColor', e.target.value)}
                    className="w-16 h-12 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={currentConfig.textColor}
                    onChange={(e) => handleColorChange('textColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Primary text color for readability</p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="font-medium text-gray-900 mb-4">Preview</h4>
            <div 
              className="p-6 rounded-lg border-2"
              style={{ 
                backgroundColor: currentConfig.backgroundColor,
                borderColor: currentConfig.primaryColor,
                color: currentConfig.textColor 
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-lg font-semibold">Salon Dashboard Preview</h5>
                <div 
                  className="px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: currentConfig.primaryColor }}
                >
                  Primary Button
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: currentConfig.secondaryColor, color: 'white' }}
                >
                  <div className="text-sm">Secondary Card</div>
                  <div className="text-lg font-bold">Sample Data</div>
                </div>
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: currentConfig.accentColor, color: 'white' }}
                >
                  <div className="text-sm">Accent Card</div>
                  <div className="text-lg font-bold">Success State</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-300">
                  <div className="text-sm" style={{ color: currentConfig.textColor }}>Regular Card</div>
                  <div className="text-lg font-bold" style={{ color: currentConfig.textColor }}>Normal Content</div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveColors}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Color Configuration</span>
            </button>
          </div>
        </>
      )}

      {/* Existing Configurations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-4">Existing Color Configurations</h4>
        {salonColors.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No color configurations saved yet</p>
        ) : (
          <div className="space-y-4">
            {salonColors.map((config) => (
              <div key={config.salonId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: config.primaryColor }}
                      title="Primary Color"
                    ></div>
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: config.secondaryColor }}
                      title="Secondary Color"
                    ></div>
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: config.accentColor }}
                      title="Accent Color"
                    ></div>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">{config.salonName}</h5>
                    <p className="text-sm text-gray-600">
                      Primary: {config.primaryColor} | Secondary: {config.secondaryColor}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    config.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {config.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleSalonSelect(config.salonId)}
                    className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Palette className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Salon Color Configuration</h4>
            <p className="text-sm text-blue-700 mt-1">
              Configure custom colors for each salon. When salon owners and reception staff login, 
              they will see the interface with their salon's configured colors. This helps maintain 
              brand consistency and provides a personalized experience for each salon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SystemSettings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const [settings, setSettings] = useState<SystemSettingsState>({
    general: {
      companyName: 'Trinexa Salon Management System',
      timezone: 'Asia/Colombo',
      dateFormat: 'DD/MM/YYYY',
      currency: 'LKR', // Default to LKR
      language: 'en',
      maintenanceMode: false,
      systemVersion: '2.1.0',
    },
    security: {
      passwordMinLength: 8,
      requireSpecialChars: true,
      requireNumbers: true,
      requireUppercase: true,
      sessionTimeout: 30,
      twoFactorAuth: false,
      loginAttempts: 5,
      ipWhitelist: [],
      encryptionLevel: 'AES-256',
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      appointmentReminders: true,
      paymentAlerts: true,
      systemAlerts: true,
      marketingEmails: false,
    },
    business: {
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      defaultOpenTime: '09:00',
      defaultCloseTime: '18:00',
      appointmentSlotDuration: 30,
      advanceBookingDays: 30,
      cancellationPolicy: '24 hours notice required',
      noShowPolicy: 'Charge 50% of service fee',
    },
    appearance: {
      theme: 'light',
      primaryColor: '#ef4444',
      secondaryColor: '#3b82f6',
      logoUrl: '',
      favicon: '',
      customCSS: '',
      fontFamily: 'Inter',
    },
    appointmentCharging: {
      chargePerAppointment: 50,
      dailySchedulerTime: '22:00',
      autoChargeEnabled: true,
      sendPaymentNotifications: true,
      currency: 'LKR', // Default to LKR
      processingFee: 2.9,
    },
  });

  const sections = [
    { id: 'general', label: 'General', icon: Settings, color: 'from-blue-500 to-blue-600' },
    { id: 'security', label: 'Security', icon: Shield, color: 'from-red-500 to-red-600' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'from-yellow-500 to-yellow-600' },
    { id: 'business', label: 'Business Rules', icon: Clock, color: 'from-green-500 to-green-600' },
    { id: 'appearance', label: 'Appearance', icon: Palette, color: 'from-purple-500 to-purple-600' },
    { id: 'appointmentCharging', label: 'Appointment Charging', icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
    { id: 'salonColors', label: 'Salon Colors', icon: Palette, color: 'from-pink-500 to-pink-600' },
  ];

  const timezones = [
    { value: 'Asia/Colombo', label: 'Sri Lanka Time (UTC+5:30)' },
    { value: 'Asia/Kolkata', label: 'India Standard Time (UTC+5:30)' },
    { value: 'America/New_York', label: 'Eastern Time (UTC-5)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (UTC-8)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (UTC+0)' },
  ];

  const currencies = [
    { value: 'LKR', label: 'Sri Lankan Rupee (LKR)', symbol: 'Rs.' },
    { value: 'USD', label: 'US Dollar (USD)', symbol: '$' },
    { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
    { value: 'GBP', label: 'British Pound (GBP)', symbol: '£' },
    { value: 'INR', label: 'Indian Rupee (INR)', symbol: '₹' },
  ];

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock save settings
      console.log('Settings saved:', settings);
      setLastSaved(new Date());
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Error saving settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (section: keyof SystemSettingsState, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const addToWhitelist = (ip: string) => {
    if (ip && !settings.security.ipWhitelist.includes(ip)) {
      updateSetting('security', 'ipWhitelist', [...settings.security.ipWhitelist, ip]);
    }
  };

  const removeFromWhitelist = (ip: string) => {
    updateSetting('security', 'ipWhitelist', settings.security.ipWhitelist.filter(item => item !== ip));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">System Settings</h2>
            <p className="text-red-100 mt-1">Configure system-wide settings and preferences</p>
          </div>
          {lastSaved && (
            <div className="text-right">
              <div className="text-sm text-red-100">Last saved</div>
              <div className="text-xs text-red-200">{lastSaved.toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {sections.map(section => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeSection === section.id
                        ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* General Settings */}
            {activeSection === 'general' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">General Settings</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={settings.general.companyName}
                      onChange={(e) => updateSetting('general', 'companyName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">System Version</label>
                    <input
                      type="text"
                      value={settings.general.systemVersion}
                      onChange={(e) => updateSetting('general', 'systemVersion', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      {timezones.map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                    <select
                      value={settings.general.dateFormat}
                      onChange={(e) => updateSetting('general', 'dateFormat', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <select
                      value={settings.general.currency}
                      onChange={(e) => updateSetting('general', 'currency', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      {currencies.map(currency => (
                        <option key={currency.value} value={currency.value}>
                          {currency.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select
                      value={settings.general.language}
                      onChange={(e) => updateSetting('general', 'language', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="en">English</option>
                      <option value="si">Sinhala</option>
                      <option value="ta">Tamil</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={settings.general.maintenanceMode}
                    onChange={(e) => updateSetting('general', 'maintenanceMode', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <label className="text-sm font-medium text-amber-900">Maintenance Mode</label>
                    <p className="text-xs text-amber-700">Enable to put the system in maintenance mode</p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Security Settings</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Password Length</label>
                    <input
                      type="number"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      min="6"
                      max="20"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      min="5"
                      max="120"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                    <input
                      type="number"
                      value={settings.security.loginAttempts}
                      onChange={(e) => updateSetting('security', 'loginAttempts', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      min="3"
                      max="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Encryption Level</label>
                    <select
                      value={settings.security.encryptionLevel}
                      onChange={(e) => updateSetting('security', 'encryptionLevel', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="AES-128">AES-128</option>
                      <option value="AES-256">AES-256</option>
                      <option value="RSA-2048">RSA-2048</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Password Requirements</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'requireSpecialChars', label: 'Require special characters' },
                      { key: 'requireNumbers', label: 'Require numbers' },
                      { key: 'requireUppercase', label: 'Require uppercase letters' },
                      { key: 'twoFactorAuth', label: 'Enable two-factor authentication' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={settings.security[item.key as keyof typeof settings.security] as boolean}
                          onChange={(e) => updateSetting('security', item.key, e.target.checked)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <label className="text-sm font-medium text-gray-700">{item.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">IP Whitelist</h4>
                  <div className="space-y-2">
                    {settings.security.ipWhitelist.map((ip, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <span className="flex-1 text-sm text-gray-700">{ip}</span>
                        <button
                          onClick={() => removeFromWhitelist(ip)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Enter IP address"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addToWhitelist((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Enter IP address"]') as HTMLInputElement;
                          if (input) {
                            addToWhitelist(input.value);
                            input.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Notification Settings</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <p className="text-xs text-gray-500">
                          {key === 'emailNotifications' && 'Send notifications via email'}
                          {key === 'smsNotifications' && 'Send notifications via SMS'}
                          {key === 'pushNotifications' && 'Send push notifications'}
                          {key === 'appointmentReminders' && 'Remind customers about appointments'}
                          {key === 'paymentAlerts' && 'Alert about payment status'}
                          {key === 'systemAlerts' && 'System maintenance and updates'}
                          {key === 'marketingEmails' && 'Promotional and marketing emails'}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                        className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Business Rules */}
            {activeSection === 'business' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Business Rules</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Opening Time</label>
                    <input
                      type="time"
                      value={settings.business.defaultOpenTime}
                      onChange={(e) => updateSetting('business', 'defaultOpenTime', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Closing Time</label>
                    <input
                      type="time"
                      value={settings.business.defaultCloseTime}
                      onChange={(e) => updateSetting('business', 'defaultCloseTime', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Slot Duration (minutes)</label>
                    <select
                      value={settings.business.appointmentSlotDuration}
                      onChange={(e) => updateSetting('business', 'appointmentSlotDuration', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Advance Booking Days</label>
                    <input
                      type="number"
                      value={settings.business.advanceBookingDays}
                      onChange={(e) => updateSetting('business', 'advanceBookingDays', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      min="1"
                      max="365"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Policy</label>
                    <input
                      type="text"
                      value={settings.business.cancellationPolicy}
                      onChange={(e) => updateSetting('business', 'cancellationPolicy', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">No-Show Policy</label>
                    <input
                      type="text"
                      value={settings.business.noShowPolicy}
                      onChange={(e) => updateSetting('business', 'noShowPolicy', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Working Days</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <div key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.business.workingDays.includes(day)}
                          onChange={(e) => {
                            const workingDays = e.target.checked
                              ? [...settings.business.workingDays, day]
                              : settings.business.workingDays.filter(d => d !== day);
                            updateSetting('business', 'workingDays', workingDays);
                          }}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <label className="text-sm text-gray-700 capitalize">{day}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Appearance Settings</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <select
                      value={settings.appearance.theme}
                      onChange={(e) => updateSetting('appearance', 'theme', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                    <select
                      value={settings.appearance.fontFamily}
                      onChange={(e) => updateSetting('appearance', 'fontFamily', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Poppins">Poppins</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={settings.appearance.primaryColor}
                        onChange={(e) => updateSetting('appearance', 'primaryColor', e.target.value)}
                        className="w-16 h-12 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={settings.appearance.primaryColor}
                        onChange={(e) => updateSetting('appearance', 'primaryColor', e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={settings.appearance.secondaryColor}
                        onChange={(e) => updateSetting('appearance', 'secondaryColor', e.target.value)}
                        className="w-16 h-12 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={settings.appearance.secondaryColor}
                        onChange={(e) => updateSetting('appearance', 'secondaryColor', e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                    <input
                      type="url"
                      value={settings.appearance.logoUrl}
                      onChange={(e) => updateSetting('appearance', 'logoUrl', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Favicon URL</label>
                    <input
                      type="url"
                      value={settings.appearance.favicon}
                      onChange={(e) => updateSetting('appearance', 'favicon', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom CSS</label>
                  <textarea
                    value={settings.appearance.customCSS}
                    onChange={(e) => updateSetting('appearance', 'customCSS', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
                    rows={6}
                    placeholder="/* Add your custom CSS here */"
                  />
                </div>
              </div>
            )}

            {/* Appointment Charging Settings */}
            {activeSection === 'appointmentCharging' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Appointment Charging Settings</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Charge per Appointment by Mobile</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={settings.appointmentCharging.chargePerAppointment}
                        onChange={(e) => updateSetting('appointmentCharging', 'chargePerAppointment', parseFloat(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Amount in LKR charged for each appointment processed</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Daily Scheduler Time</label>
                    <input
                      type="time"
                      value={settings.appointmentCharging.dailySchedulerTime}
                      onChange={(e) => updateSetting('appointmentCharging', 'dailySchedulerTime', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">Time when daily charges are processed automatically</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Charge per Appointment by Reception</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={settings.appointmentCharging.processingFee}
                        onChange={(e) => updateSetting('appointmentCharging', 'processingFee', parseFloat(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Amount in LKR charged for each appointment processed by reception</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <select
                      value={settings.appointmentCharging.currency}
                      onChange={(e) => updateSetting('appointmentCharging', 'currency', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="LKR">Sri Lankan Rupee (LKR)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="GBP">British Pound (GBP)</option>
                      <option value="INR">Indian Rupee (INR)</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Automation Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Auto-charge enabled</h4>
                        <p className="text-sm text-gray-600">Automatically charge salons for daily appointments</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.appointmentCharging.autoChargeEnabled}
                        onChange={(e) => updateSetting('appointmentCharging', 'autoChargeEnabled', e.target.checked)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Send payment notifications</h4>
                        <p className="text-sm text-gray-600">Email notifications for successful and failed payments</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.appointmentCharging.sendPaymentNotifications}
                        onChange={(e) => updateSetting('appointmentCharging', 'sendPaymentNotifications', e.target.checked)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <DollarSign className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-emerald-900">Appointment Charging System</h4>
                      <p className="text-sm text-emerald-700 mt-1">
                        This system automatically charges salon owners in LKR for each appointment processed through the platform. 
                        Charges are processed daily at the specified time using the salon's default payment method.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Salon Colors Configuration */}
            {activeSection === 'salonColors' && (
              <SalonColorsConfiguration />
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                } text-white`}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;