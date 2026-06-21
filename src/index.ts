/*
  # Author : Watchara Pongsri
  # [github/X-c0d3] https://github.com/X-c0d3/
  # Web Site: https://www.rockdevper.com
*/


import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { sha256, nonce, hashPassword, decryptSecret, generateSign } from '../util/Utility'
import { MappingData } from '../util/ResponseData'
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
};

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
            'Accept': 'application/json',

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
    const json = await signedPost(
        `${CONFIG.baseUrl}/apis/login/account`,
        {
            account: CONFIG.account,
            password: hashPassword(CONFIG.password),
        }
    );

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

    const res = await fetch(
        `${CONFIG.baseUrl}/apis/deviceState/simple/state/latest/v1?deviceId=${CONFIG.deviceId}&dataSource=1`,
        {
            headers: {
                'Accept': 'application/json',
                'IOT-Time-Zone': CONFIG.timezone,
                'IOT-Token': accessToken!,
            },
        }
    );

    const json: any = await res.json();

    if (json.code !== 0) {
        throw new Error(json.message);
    }

    return json.data.fields;
}



// ================= SAFE VALUE =================
const V = (x: any) => (x?.value ?? '-');

// ================= POLL =================
async function poll() {
    try {

        process.stderr.write(`[FETCH] ${new Date().toISOString()}\n`);
        const f = await fetchState();
        const out: Record<string, { value: number | string; unit: string }> = {};
        for (const [src, dst] of Object.entries(MappingData)) {
            if (f[src]) out[dst] = { value: f[src].valueDisplay ?? f[src].value, unit: f[src].unit };
        }

        console.clear();
        console.log(`[${new Date().toLocaleTimeString()}] Solar of Things — VMDC-5K48`);
        console.log('═'.repeat(50));

        console.log('☀️  PV');
        console.log(`   Total    : ${V(out.pv_total_power)} kW   (${V(out.pv_status)})`);
        console.log(`   PV1      : ${V(out.pv1_voltage)}V  ${V(out.pv1_current)}A  ${V(out.pv1_power)}kW`);
        console.log(`   PV2      : ${V(out.pv2_voltage)}V  ${V(out.pv2_current)}A  ${V(out.pv2_power)}kW`);
        console.log(`   Energy   : today ${V(out.pv_energy_today)} / month ${V(out.pv_energy_month)} / year ${V(out.pv_energy_year)} / total ${V(out.pv_energy_total)} kWh`);

        console.log('\n🔋  BATTERY');
        console.log(`   ${V(out.battery_voltage)}V  ${V(out.battery_current)}A  ${V(out.battery_power)}kW  SOC ${V(out.battery_soc)}%  SOH ${V(out.battery_soh)}%`);
        console.log(`   stage ${V(out.charge_stage)}  |  rated ${V(out.battery_rated_voltage)}V  cap ${V(out.battery_capacity)}Ah`);

        console.log('\n⚡  LOAD');
        console.log(`   ${V(out.load_power)} kW   (${V(out.output_voltage)}V  ${V(out.output_current)}A)   ${V(out.op_status)}`);
        console.log(`   today ${V(out.load_energy_today)} kWh  |  bus ${V(out.bus_voltage)}V  |  rated ${V(out.output_rated_power)}W`);

        console.log('\n🔌  GRID/METER');
        console.log(`   V R/S/T  : ${V(out.meter_v_r)}/${V(out.meter_v_s)}/${V(out.meter_v_t)} V   power ${V(out.meter_active_power)}kW`);
        console.log(`   comm ${V(out.meter_comm)}  |  purchase ${V(out.grid_purchase_total)}Wh  sale ${V(out.grid_sale_total)}Wh`);

        console.log('\n🧠  BMS');
        console.log(`   comm ${V(out.bms_comm)}  |  chg ${V(out.bms_charge_v_limit)}V/${V(out.bms_charge_a_limit)}A  dis ${V(out.bms_discharge_v_limit)}V/${V(out.bms_discharge_a_limit)}A`);

        console.log('\n🌡️   TEMP');
        console.log(`   heatsink ${V(out.temp_heatsink)}  radiator ${V(out.temp_radiator)}  PV ${V(out.temp_pv)}  OP ${V(out.temp_op)}  env ${V(out.temp_env)}  cell ${V(out.temp_cell_avg)} °C`);

        console.log('\nℹ️   DEVICE');
        console.log(`   ${V(out.working_mode)}  |  model ${V(out.model)}  sw ${V(out.sw_version)}  |  income today ${V(out.income_today)} / total ${V(out.income_total)}`);

        console.log('═'.repeat(50));
        console.log(`fields mapped: ${Object.keys(out).length}  |  refresh 3s  |  Ctrl+C to quit`);

    } catch (e: any) {
        console.error('ERR:', e.message);
    }
}

// ================= START =================
(async () => {
    await login();
    poll();
    setInterval(poll, 5000); // ✅ แนะนำ 5s
})();