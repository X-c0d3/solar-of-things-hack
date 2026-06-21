
// field ที่สนใจ → ชื่อ HA-friendly
export const MappingData: Record<string, string> = {
    // ---------- PV ----------
    pv1Voltage: 'pv1_voltage',
    pv1Current: 'pv1_current',
    pv1Power: 'pv1_power',
    pv2Voltage: 'pv2_voltage',
    pv2Current: 'pv2_current',
    pv2Power: 'pv2_power',
    generationPower: 'pv_total_power',
    pvStatus: 'pv_status',
    pvGeneratedEnergyOfDay: 'pv_energy_today',
    totalPvPowerGeneration: 'pv_energy_total',
    pvMonthlyPowerGeneration: 'pv_energy_month',
    pvAnnualPowerGeneration: 'pv_energy_year',
    // ---------- Battery ----------
    battery_voltage: 'battery_voltage',
    battery_current: 'battery_current',
    batteryPower: 'battery_power',
    battery_charge_state: 'battery_soc',
    gsohAverage: 'battery_soh',
    batteryChargedStage: 'charge_stage',
    ratedBatteryVoltage: 'battery_rated_voltage',
    limitBatteryCapacity: 'battery_capacity',
    // ---------- Load / Output ----------
    load_power: 'load_power',                 // 0.52 kW ← ใช้ตัวนี้ (outputPower unit ผิด)
    outputVoltage: 'output_voltage',
    outputCurrent: 'output_current',
    outputTheDailyPowerConsumption: 'load_energy_today',
    ratedOutputPower: 'output_rated_power',
    opStatus: 'op_status',
    positiveBusbarVoltage: 'bus_voltage',
    // ---------- Grid / Meter ----------
    rPhaseVoltageOfElectricMeter: 'meter_v_r',
    sPhaseVoltageOfElectricMeter: 'meter_v_s',
    tPhaseVoltageOfElectricMeter: 'meter_v_t',
    totalActivePowerOfTheElectricMeter: 'meter_active_power',
    totalGridPowerPurchase: 'grid_purchase_total',
    totalGridPowerSale: 'grid_sale_total',
    electricMeterCommunicationFlag: 'meter_comm',
    // ---------- BMS ----------
    bmsCommunicationBuilt: 'bms_comm',
    gbmsChargeVoltageLimit: 'bms_charge_v_limit',
    gbmsDischargeVoltageLimit: 'bms_discharge_v_limit',
    gbmsChargeCurrentLimit: 'bms_charge_a_limit',
    gbmsDischargeCurrentLimit: 'bms_discharge_a_limit',
    // ---------- Temperature ----------
    maxHeatSinkTemperature: 'temp_heatsink',
    maximumRadiatorTemperature: 'temp_radiator',
    internalTemperature1: 'temp_pv',
    internalTemperature2: 'temp_op',
    temperatureOfPart3: 'temp_env',
    gcellTemperatureAverage: 'temp_cell_avg',
    // ---------- Device ----------
    workingMode: 'working_mode',
    model: 'model',
    softwareVersion: 'sw_version',
    accumulatedIncome: 'income_total',
    dailyIncome: 'income_today',
};