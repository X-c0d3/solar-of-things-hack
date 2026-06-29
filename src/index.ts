/*
  # Author : Watchara Pongsri
  # [github/X-c0d3] https://github.com/X-c0d3/
  # Web Site: https://www.rockdevper.com
*/

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import mqtt from 'mqtt';
import { sha256, nonce, hashPassword, decryptSecret, generateSign, toLocalDateTimeTH, dateToLocalDateTimeTH } from '../util/Utility';
import { MappingData } from '../util/ResponseData';
dotenv.config();

// ================= CONFIG =================
const CONFIG = {
  baseUrl: process.env.BASE_URL!,
  account: process.env.ACCOUNT!,
  password: process.env.PASSWORD!,
  appId: process.env.APP_ID!,
  openAppSecret: process.env.OPEN_APP_SECRET!,
  deviceId: process.env.DEVICE_ID!,
  timezone: process.env.TIMEZONE || 'Asia/Bangkok',

  MQTT_BROKER: process.env.MQTT_BROKER!,
  MQTT_USERNAME: process.env.MQTT_USERNAME!,
  MQTT_PASSWORD: process.env.MQTT_PASSWORD!,
  MQTT_TOPIC_BASE: process.env.MQTT_TOPIC_BASE!,
};

const mqttClient = mqtt.connect(CONFIG.MQTT_BROKER || '', {
  username: CONFIG.MQTT_USERNAME || undefined,
  password: CONFIG.MQTT_PASSWORD || undefined,
  clientId: 'solar_of_things_' + Math.random().toString(16).substr(2, 8),
  reconnectPeriod: 5000,
});

mqttClient.on('connect', () => console.log('Connected to MQTT broker'));
mqttClient.on('error', (err) => console.error('MQTT error:', err.message));

// ================= STATE =================
let accessToken: string | null = null;
let expireAt = 0;

const REAL_SECRET = decryptSecret(CONFIG.appId, CONFIG.openAppSecret);

async function signedPost(url: string, body: any) {
  const n = nonce();
  const bodyStr = JSON.stringify(body);
  const bodyHash = sha256(bodyStr).toLowerCase();

  const baseHeaders = {
    'IOT-Open-AppID': CONFIG.appId,
    'IOT-Open-Nonce': n,
    'IOT-Open-Body-Hash': bodyHash,
  };

  const sign = generateSign(baseHeaders, REAL_SECRET);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...baseHeaders,
      'IOT-Open-Sign': sign,
      'IOT-Time-Zone': CONFIG.timezone,
      'IOT-Token': accessToken ?? 'null',
    },
    body: bodyStr,
  });

  const json: any = await res.json();
  if (json.code !== 0) {
    throw new Error(json.message);
  }

  return json;
}

// ================= LOGIN =================
async function login() {
  const json = await signedPost(`${CONFIG.baseUrl}/apis/login/account`, {
    account: CONFIG.account,
    password: hashPassword(CONFIG.password),
  });

  accessToken = json.data.accessToken;
  expireAt = Date.now() + Number(json.data.accessTokenWillExpiredInMillis);
  console.log('✅ LOGIN OK');
}

// ================= TOKEN =================
async function ensureToken() {
  if (!accessToken || Date.now() > expireAt - 5 * 60 * 1000) {
    console.log('[AUTH] refreshing token...');
    await login();
  }
}

// ================= FETCH STATE =================
async function fetchState() {
  await ensureToken();

  const res = await fetch(`${CONFIG.baseUrl}/apis/deviceState/simple/state/latest/v1?deviceId=${CONFIG.deviceId}&dataSource=1`, {
    headers: {
      Accept: 'application/json',
      'IOT-Time-Zone': CONFIG.timezone,
      'IOT-Token': accessToken!,
    },
  });

  const json: any = await res.json();

  if (json.code !== 0) {
    throw new Error(json.message);
  }

  return json.data;
}

async function fetchEnergyFlowState() {
  await ensureToken();

  const res = await fetch(`${CONFIG.baseUrl}/apis/deviceState/simple/energy/flow/v1?deviceId=${CONFIG.deviceId}&dataSource=2`, {
    headers: {
      Accept: 'application/json',
      'IOT-Time-Zone': CONFIG.timezone,
      'IOT-Token': accessToken!,
    },
  });

  const json: any = await res.json();

  if (json.code !== 0) {
    throw new Error(json.message);
  }

  return json.data.batteryFlow;
}

// ================= SAFE VALUE =================
const V = (x: any) => x?.value ?? '-';

// ================= POLL =================
async function poll() {
  try {
    process.stderr.write(`[FETCH] ${new Date().toISOString()}\n`);
    const { fields, time } = await fetchState();
    const out: Record<string, { value: number | string; unit: string }> = {};
    for (const [src, dst] of Object.entries(MappingData)) {
      if (fields[src]) out[dst] = { value: fields[src].valueDisplay ?? fields[src].value, unit: fields[src].unit };
    }

    console.clear();
    console.log(`[${new Date().toLocaleString()}] Solar of Things — MSDC-5K48`);
    console.log('═'.repeat(50));

    //console.log('Received from Socket.IO:', sensorData);
    const topic = `${CONFIG.MQTT_TOPIC_BASE}/SOLAR_OF_THINGS/state`;
    console.log(toLocalDateTimeTH(), `Publish to MQTT topic:`, topic);

    out.timestamp = { value: dateToLocalDateTimeTH(time), unit: '' };
    mqttClient.publish(topic, JSON.stringify(out), { qos: 1, retain: true }, (err) => {
      if (err) console.error('Publish error:', err);
    });

    console.log('☀️  PV');
    console.log(`   Total    : ${V(out.pv_total_power) * 1000} kW   (${V(out.pv_status)})`);
    console.log(`   PV1      : ${V(out.pv1_voltage)}V  ${V(out.pv1_current)}A  ${V(out.pv1_power) * 1000}kW`);
    console.log(`   PV2      : ${V(out.pv2_voltage)}V  ${V(out.pv2_current)}A  ${V(out.pv2_power) * 1000}kW`);
    console.log(
      `   Energy   : today ${V(out.pv_energy_today)} / month ${V(out.pv_energy_month)} / year ${V(out.pv_energy_year)} / total ${V(out.pv_energy_total)} kWh`,
    );

    console.log('\n🔋  BATTERY');
    console.log(
      `   ${V(out.battery_voltage)}V  ${V(out.battery_current)}A  ${V(out.battery_power) * 1000}kW  SOC ${V(out.battery_soc)}%  SOH ${V(out.battery_soh)}%`,
    );
    console.log(`   stage ${V(out.charge_stage)}  |  rated ${V(out.battery_rated_voltage)}V  cap ${V(out.battery_capacity)}Ah`);

    console.log('\n⚡  LOAD');
    console.log(`   ${V(out.load_power) * 1000} kW   (${V(out.output_voltage)}V  ${V(out.output_current)}A)   ${V(out.op_status)}`);
    console.log(`   today ${V(out.load_energy_today) * 1000} kWh  |  bus ${V(out.bus_voltage)}V  |  rated ${V(out.output_rated_power)}W`);

    console.log('\n🔌  GRID/METER');
    console.log(`   V R/S/T  : ${V(out.meter_v_r)}/${V(out.meter_v_s)}/${V(out.meter_v_t)} V   power ${V(out.meter_active_power)}kW`);
    console.log(`   comm ${V(out.meter_comm)}  |  purchase ${V(out.grid_purchase_total)}Wh  sale ${V(out.grid_sale_total)}Wh`);

    console.log('\n🧠  BMS');
    console.log(
      `   comm ${V(out.bms_comm)}  |  chg ${V(out.bms_charge_v_limit)}V/${V(out.bms_charge_a_limit)}A  dis ${V(out.bms_discharge_v_limit)}V/${V(out.bms_discharge_a_limit)}A`,
    );

    console.log('\n🌡️   TEMP');
    console.log(
      `  TXT Temp ${V(out.temp_txt)}  heatsink ${V(out.temp_heatsink)}  radiator ${V(out.temp_radiator)}  PV ${V(out.temp_pv)}  OP ${V(out.temp_op)}  ENV Temperature ${V(out.temp_env)}  cell ${V(out.temp_cell_avg)} °C`,
    );

    console.log('\nℹ️   DEVICE');
    console.log(
      `   ${V(out.working_mode)}  |  model ${V(out.model)}  sw ${V(out.sw_version)}  |  income today ${V(out.income_today)} / total ${V(out.income_total)}`,
    );
    console.log('Last updated:', time);
  } catch (e: any) {
    console.error('ERR:', e.message);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  mqttClient.end();
  process.exit(0);
});

(async () => {
  await login();
  poll();
  setInterval(poll, 5000); // ✅ recommended 5s
  setInterval(async () => {
    try {
      const energyFlow = await fetchEnergyFlowState();
      console.log('\n🔄  ENERGY FLOW');
      console.log(`   ${JSON.stringify(energyFlow)}`);
    } catch (e: any) {
      console.error('ERR (energy flow):', e.message);
    }
  }, 15000); // ✅ recommended 15s
})();
