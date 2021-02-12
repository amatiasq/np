import './BusinessIndicator.scss';

import React, { useEffect, useState } from 'react';

import { onBusinessChange } from '../../services/busy-indicator';
import { Icon } from './Icon';

export function BusinessIndicator() {
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => onBusinessChange(setIsBusy) as () => void);

  if (!isBusy) {
    return null;
  }

  return (
    <div className="business-indicator">
      <Icon name="circle-notch" className="business-indicator--icon" />
    </div>
  );
}
