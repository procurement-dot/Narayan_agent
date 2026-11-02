import React from 'react';
import { PillTabs } from '../../../shared/components/PillTabs';
import { EMAIL_TABS } from '../constants';
import { EmailTab } from '../types/email.types';

interface EmailTabsProps {
  activeTab: EmailTab;
  onSelectTab: (tab: EmailTab) => void;
}

export const EmailTabs: React.FC<EmailTabsProps> = ({ activeTab, onSelectTab }) => {
  return (
    <PillTabs<EmailTab>
      tabs={EMAIL_TABS}
      activeTab={activeTab}
      onSelectTab={onSelectTab}
    />
  );
};
