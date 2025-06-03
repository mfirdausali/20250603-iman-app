import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, BookOpen, Star, Volume2, Eye, Globe, Settings as SettingsIcon } from 'lucide-react';
import { storage } from '../utils/storage';
import clsx from 'clsx';

const SettingCard = ({ title, description, icon: Icon, children, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    purple: 'text-purple-600 bg-purple-50'
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={clsx('p-2 rounded-lg', colorClasses[color])}>
          <Icon className={clsx('w-5 h-5', colorClasses[color].split(' ')[0])} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
};

const NumberInput = ({ label, value, onChange, min = 1, max = 10 }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-slate-700">{label}</label>
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="p-2 btn-secondary rounded-lg"
        disabled={value <= min}
      >
        -
      </button>
      <span className="w-12 text-center font-semibold text-slate-800">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="p-2 btn-secondary rounded-lg"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  </div>
);

const Toggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {description && <p className="text-xs text-slate-500">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
        checked ? 'bg-primary-500' : 'bg-slate-300'
      )}
    >
      <span
        className={clsx(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  </div>
);

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    const loadedSettings = storage.getSettings();
    // Ensure all required settings exist with proper defaults
    return {
      hafazan: {
        visibleSets: 3,
        repetitionsPerVisibleSet: 2,
        hiddenSets: 2,
        repetitionsPerHiddenSet: 1,
        ...loadedSettings.hafazan
      },
      murajaah: {
        visibleSets: 1,
        repetitionsPerVisibleSet: 1,
        hiddenSets: 1,
        repetitionsPerHiddenSet: 1,
        ...loadedSettings.murajaah
      },
      general: {
        autoPlayAudio: true,
        showAudioPlayer: true,
        showTransliteration: true,
        showTranslation: true,
        enableMurajaah: true,
        murajaahFrequency: 7,
        murajaahRangeSize: 5,
        ...loadedSettings.general
      }
    };
  });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('hafazan');

  const handleChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    storage.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'hafazan', label: 'Hafazan', icon: BookOpen, color: 'blue' },
    { id: 'murajaah', label: 'Murajaah', icon: Star, color: 'amber' },
    { id: 'general', label: 'General', icon: SettingsIcon, color: 'emerald' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Settings</h1>
        <p className="text-slate-600">Customize your memorization experience</p>

        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-700 text-sm"
          >
            ✓ Settings saved successfully!
          </motion.div>
        )}
      </div>

      <div className="glass-card rounded-xl p-2">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200',
                  activeTab === tab.id
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {activeTab === 'hafazan' && (
          <SettingCard
            title="New Memorization Settings"
            description="Configure how you learn new ayahs"
            icon={BookOpen}
            color="blue"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NumberInput
                label="Visible Sets"
                value={settings.hafazan.visibleSets}
                onChange={(value) => handleChange('hafazan', 'visibleSets', value)}
                max={5}
              />
              <NumberInput
                label="Repetitions per Visible Set"
                value={settings.hafazan.repetitionsPerVisibleSet}
                onChange={(value) => handleChange('hafazan', 'repetitionsPerVisibleSet', value)}
                max={5}
              />
              <NumberInput
                label="Hidden Sets"
                value={settings.hafazan.hiddenSets}
                onChange={(value) => handleChange('hafazan', 'hiddenSets', value)}
                max={5}
              />
              <NumberInput
                label="Repetitions per Hidden Set"
                value={settings.hafazan.repetitionsPerHiddenSet}
                onChange={(value) => handleChange('hafazan', 'repetitionsPerHiddenSet', value)}
                max={5}
              />
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Total:</strong>{' '}
                {settings.hafazan.visibleSets * settings.hafazan.repetitionsPerVisibleSet +
                  settings.hafazan.hiddenSets * settings.hafazan.repetitionsPerHiddenSet}{' '}
                repetitions per ayah
              </p>
            </div>
          </SettingCard>
        )}

        {activeTab === 'murajaah' && (
          <SettingCard
            title="Review Settings"
            description="Configure how you review memorized ayahs"
            icon={Star}
            color="amber"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NumberInput
                label="Visible Sets"
                value={settings.murajaah.visibleSets}
                onChange={(value) => handleChange('murajaah', 'visibleSets', value)}
                max={5}
              />
              <NumberInput
                label="Repetitions per Visible Set"
                value={settings.murajaah.repetitionsPerVisibleSet}
                onChange={(value) => handleChange('murajaah', 'repetitionsPerVisibleSet', value)}
                max={5}
              />
              <NumberInput
                label="Hidden Sets"
                value={settings.murajaah.hiddenSets}
                onChange={(value) => handleChange('murajaah', 'hiddenSets', value)}
                max={5}
              />
              <NumberInput
                label="Repetitions per Hidden Set"
                value={settings.murajaah.repetitionsPerHiddenSet}
                onChange={(value) => handleChange('murajaah', 'repetitionsPerHiddenSet', value)}
                max={5}
              />
            </div>
            <div className="mt-4 p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Total:</strong>{' '}
                {settings.murajaah.visibleSets * settings.murajaah.repetitionsPerVisibleSet +
                  settings.murajaah.hiddenSets * settings.murajaah.repetitionsPerHiddenSet}{' '}
                repetitions per review
              </p>
            </div>
          </SettingCard>
        )}

        {activeTab === 'general' && (
          <div className="space-y-6">
            <SettingCard
              title="Audio Settings"
              description="Configure audio playback preferences"
              icon={Volume2}
              color="emerald"
            >
              <div className="space-y-4">
                <Toggle
                  label="Show Audio Player"
                  description="Display audio controls during memorization sessions"
                  checked={settings.general.showAudioPlayer}
                  onChange={(value) => handleChange('general', 'showAudioPlayer', value)}
                />
                <Toggle
                  label="Auto Play Audio"
                  description="Automatically play audio when ayah loads"
                  checked={settings.general.autoPlayAudio}
                  onChange={(value) => handleChange('general', 'autoPlayAudio', value)}
                />
              </div>
            </SettingCard>

            <SettingCard
              title="Display Settings"
              description="Customize what text is shown during sessions"
              icon={Eye}
              color="purple"
            >
              <div className="space-y-4">
                <Toggle
                  label="Show Transliteration"
                  description="Display phonetic pronunciation guide"
                  checked={settings.general.showTransliteration}
                  onChange={(value) => handleChange('general', 'showTransliteration', value)}
                />
                <Toggle
                  label="Show Translation"
                  description="Display English translation of ayahs"
                  checked={settings.general.showTranslation}
                  onChange={(value) => handleChange('general', 'showTranslation', value)}
                />
              </div>
            </SettingCard>

            <SettingCard
              title="Murajaah Settings"
              description="Configure review scheduling"
              icon={Globe}
              color="amber"
            >
              <div className="space-y-4">
                <Toggle
                  label="Enable Murajaah"
                  description="Automatically schedule review sessions"
                  checked={settings.general.enableMurajaah}
                  onChange={(value) => handleChange('general', 'enableMurajaah', value)}
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Murajaah Frequency (days)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleChange('general', 'murajaahFrequency', Math.max(1, settings.general.murajaahFrequency - 1))}
                      className="p-2 btn-secondary rounded-lg"
                      disabled={settings.general.murajaahFrequency <= 1}
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-semibold text-slate-800">
                      {settings.general.murajaahFrequency}
                    </span>
                    <button
                      onClick={() => handleChange('general', 'murajaahFrequency', Math.min(30, settings.general.murajaahFrequency + 1))}
                      className="p-2 btn-secondary rounded-lg"
                      disabled={settings.general.murajaahFrequency >= 30}
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Schedule reviews every {settings.general.murajaahFrequency} day{settings.general.murajaahFrequency > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Murajaah Range Size (ayahs)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleChange('general', 'murajaahRangeSize', Math.max(1, (settings.general.murajaahRangeSize || 5) - 1))}
                      className="p-2 btn-secondary rounded-lg"
                      disabled={(settings.general.murajaahRangeSize || 5) <= 1}
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-semibold text-slate-800">
                      {settings.general.murajaahRangeSize || 5}
                    </span>
                    <button
                      onClick={() => handleChange('general', 'murajaahRangeSize', Math.min(10, (settings.general.murajaahRangeSize || 5) + 1))}
                      className="p-2 btn-secondary rounded-lg"
                      disabled={(settings.general.murajaahRangeSize || 5) >= 10}
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Review {settings.general.murajaahRangeSize || 5} ayah{(settings.general.murajaahRangeSize || 5) > 1 ? 's' : ''} together per session
                  </p>
                </div>
              </div>
            </SettingCard>
          </div>
        )}
      </motion.div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 btn-primary rounded-lg font-medium flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
