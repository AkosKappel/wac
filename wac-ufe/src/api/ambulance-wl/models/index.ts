/* tslint:disable */
/* eslint-disable */
/**
 * Department of the hospital
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
    code?: string;
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
}
