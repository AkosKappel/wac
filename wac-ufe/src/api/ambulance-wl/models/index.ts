/* tslint:disable */
/* eslint-disable */
/**
 * 
 * @export
 * @interface ChangeRecord
 */
export interface ChangeRecord {
    /**
     * 
     */
    changedAt: string;
    /**
     * 
     */
    changes: Array<FieldChange>;
}
/**
 * Department of the hospital; devices refer to it by code
 * @export
 * @interface Department
 */
export interface Department {
    /**
     * 
     */
    name: string;
    /**
     * 
     */
    code: string;
    /**
     * 
     */
    floor?: string;
    /**
     * Head of the department
     */
    head?: string;
}
/**
 * 
 * @export
 * @interface DepartmentStats
 */
export interface DepartmentStats {
    /**
     * 
     */
    code: string;
    /**
     * 
     */
    name: string;
    /**
     * 
     */
    count: number;
    /**
     * 
     */
    totalValue: number;
    /**
     * 
     */
    averageValue: number;
}
/**
 * 
 * @export
 * @interface DeviceListEntry
 */
export interface DeviceListEntry {
    /**
     * Unique id of the device
     */
    id: string;
    /**
     * Name of the device
     */
    name: string;
    /**
     * Registration number of the device
     */
    deviceId: string;
    /**
     * End of the warranty
     */
    warrantyUntil: string;
    /**
     * Price of device
     */
    price?: number;
    /**
     * 
     */
    logList?: Array<DeviceLog>;
    /**
     * 
     */
    department?: Department;
    /**
     * Days between two services; no service plan when missing
     */
    serviceIntervalDays?: number;
    /**
     * Latest log entry of type service; set by the server
     */
    readonly lastServiceAt?: string;
    /**
     * Changes of the device fields, newest last; kept by the server
     */
    readonly history?: Array<ChangeRecord>;
}
/**
 * 
 * @export
 * @interface DeviceLog
 */
export interface DeviceLog {
    /**
     * Unique id of the log
     */
    id: string;
    /**
     * Text of log operation
     */
    text: string;
    /**
     * Registration number of the device; filled by the server from the device
     */
    deviceId: string;
    /**
     * When the operation happened; set by the server when missing
     */
    createdAt?: string;
    /**
     * 
     */
    type?: LogType;
}


/**
 * 
 * @export
 * @interface FieldChange
 */
export interface FieldChange {
    /**
     * One of name, deviceId, warrantyUntil, price, department, serviceIntervalDays
     */
    field: string;
    /**
     * 
     */
    from: string;
    /**
     * 
     */
    to: string;
}

/**
 * Kind of operation; a service entry moves the device's lastServiceAt
 * @export
 */
export const LogType = {
    Purchase: 'purchase',
    Installation: 'installation',
    Service: 'service',
    Calibration: 'calibration',
    Repair: 'repair',
    Other: 'other',
} as const;
export type LogType = typeof LogType[keyof typeof LogType];

/**
 * 
 * @export
 * @interface MaintenanceItem
 */
export interface MaintenanceItem {
    /**
     * 
     */
    id: string;
    /**
     * 
     */
    name: string;
    /**
     * 
     */
    deviceId: string;
    /**
     * 
     */
    department?: Department;
    /**
     * 
     */
    serviceIntervalDays: number;
    /**
     * 
     */
    lastServiceAt?: string;
    /**
     * 
     */
    nextServiceAt: string;
    /**
     * The next service date has passed, or the device was never serviced
     */
    overdue: boolean;
}
/**
 * 
 * @export
 * @interface MonthCount
 */
export interface MonthCount {
    /**
     * 
     */
    month: string;
    /**
     * 
     */
    count: number;
}
/**
 * 
 * @export
 * @interface Stats
 */
export interface Stats {
    /**
     * 
     */
    deviceCount: number;
    /**
     * 
     */
    totalValue: number;
    /**
     * 
     */
    warranty: WarrantyStats;
    /**
     * Highest total value first
     */
    departments: Array<DepartmentStats>;
    /**
     * The last 12 months with entries, oldest first
     */
    logsPerMonth: Array<MonthCount>;
}
/**
 * 
 * @export
 * @interface WarrantyStats
 */
export interface WarrantyStats {
    /**
     * 
     */
    ok: number;
    /**
     * Ends within 90 days
     */
    expiring: number;
    /**
     * 
     */
    expired: number;
}
