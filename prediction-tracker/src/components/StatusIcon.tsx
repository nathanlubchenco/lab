import React from 'react';
import {
  Circle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';

export interface StatusIconProps {
  status: 'pending' | 'on_track' | 'at_risk' | 'succeeded' | 'failed' | 'revised';
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <Circle className="text-gray-400" size={20} />;
    case 'on_track':
      return <Circle className="text-green-500" size={20} />;
    case 'at_risk':
      return <Circle className="text-yellow-500" size={20} />;
    case 'succeeded':
      return <CheckCircle className="text-green-500" size={20} />;
    case 'failed':
      return <XCircle className="text-red-500" size={20} />;
    case 'revised':
      return <RefreshCw className="text-orange-500" size={20} />;
    default:
      return null;
  }
};