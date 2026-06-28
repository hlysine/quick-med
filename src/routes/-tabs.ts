import {
  FaCalculator,
  FaBookMedical,
  FaSyringe,
  FaSearch,
  FaCog,
  FaHeartbeat,
  FaFlask,
  FaTired,
  FaTasks,
} from 'react-icons/fa';
import { IconType } from 'react-icons/lib';

export enum TabKeys {
  Calculators = '/calc',
  Conditions = '/conditions',
  Investigations = '/investigations',
  Managements = '/managements',
  Search = '/search',
  Settings = '/settings',
  Todo = '/todo',
}

export interface Tab {
  name: string;
  icon: IconType;
  to: string;
  dock: boolean;
}

export const tabs: Tab[] = [
  {
    name: 'Calculators',
    icon: FaCalculator,
    to: TabKeys.Calculators,
    dock: true,
  },
  {
    name: 'Conditions',
    icon: FaBookMedical,
    to: TabKeys.Conditions,
    dock: true,
  },
  {
    name: 'Ix',
    icon: FaFlask,
    to: TabKeys.Investigations,
    dock: true,
  },
  {
    name: 'Mx',
    icon: FaSyringe,
    to: TabKeys.Managements,
    dock: true,
  },
  {
    name: 'Search',
    icon: FaSearch,
    to: TabKeys.Search,
    dock: true,
  },
  {
    name: 'Tasks',
    icon: FaTasks,
    to: TabKeys.Todo,
    dock: true,
  },
  {
    name: 'Settings',
    icon: FaCog,
    to: TabKeys.Settings,
    dock: false,
  },
] as const;

export const pinnedTabs: Tab[] = [
  {
    name: 'Epinephrine',
    icon: FaSyringe,
    to: '/managements/epinephrine',
    dock: false,
  },
  {
    name: 'Cardiac Arrest',
    icon: FaHeartbeat,
    to: '/conditions/cardiac-arrest',
    dock: false,
  },
  {
    name: 'Desaturation',
    icon: FaTired,
    to: '/conditions/desaturation',
    dock: false,
  },
];

export const dockTabs = tabs.filter(tab => tab.dock);
