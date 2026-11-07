import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const USERS_FILE = path.resolve(DATA_DIR, 'tracked-users.json');

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  province: string;
  isTargetProvince: boolean;
  district?: string;
  address?: string;
  source: 'telegram_gps' | 'web_gps' | 'manual_selection' | 'ip_estimate';
  capturedAt: string;
}

export interface UserActivityLog {
  id: string;
  timestamp: string;
  action: 'start' | 'message' | 'photo_diagnosis' | 'voice_query' | 'location_share' | 'tts_listen' | 'faq_read';
  details: string;
  category?: 'crop' | 'livestock' | 'general' | 'location';
  locationSnapshot?: string;
}

export interface TrackedUser {
  id: string; // e.g., 'tg_12345678' or 'web_abc123'
  platform: 'telegram' | 'web';
  name: string;
  username?: string;
  avatarUrl?: string;
  firstSeen: string;
  lastActive: string;
  sessionCount: number;
  messageCount: number;
  cropInterests: string[];
  lastQuery?: string;
  location?: UserLocation;
  activities: UserActivityLog[];
  status: 'active' | 'idle' | 'offline';
}

// 14 Official Target Provinces of LASED III with coordinates and approximate bounds
export interface TargetProvinceInfo {
  nameKh: string;
  nameEn: string;
  lat: number;
  lng: number;
  radiusKm: number;
  isLasedTarget: boolean;
}

export const CAMBODIA_PROVINCES: TargetProvinceInfo[] = [
  // 14 LASED III Target Provinces
  { nameKh: 'កំពង់ឆ្នាំង', nameEn: 'Kampong Chhnang', lat: 12.2500, lng: 104.6667, radiusKm: 45, isLasedTarget: true },
  { nameKh: 'បាត់ដំបង', nameEn: 'Battambang', lat: 13.0957, lng: 103.2022, radiusKm: 60, isLasedTarget: true },
  { nameKh: 'បន្ទាយមានជ័យ', nameEn: 'Banteay Meanchey', lat: 13.5859, lng: 102.9737, radiusKm: 50, isLasedTarget: true },
  { nameKh: 'ឧត្តរមានជ័យ', nameEn: 'Oddar Meanchey', lat: 14.1800, lng: 103.5167, radiusKm: 55, isLasedTarget: true },
  { nameKh: 'ក្រចេះ', nameEn: 'Kratie', lat: 12.4881, lng: 106.0188, radiusKm: 65, isLasedTarget: true },
  { nameKh: 'ស្ទឹងត្រែង', nameEn: 'Stung Treng', lat: 13.5259, lng: 105.9683, radiusKm: 70, isLasedTarget: true },
  { nameKh: 'រតនគិរី', nameEn: 'Ratanakiri', lat: 13.7333, lng: 106.9833, radiusKm: 60, isLasedTarget: true },
  { nameKh: 'មណ្ឌលគិរី', nameEn: 'Mondulkiri', lat: 12.4500, lng: 107.1833, radiusKm: 75, isLasedTarget: true },
  { nameKh: 'កំពង់ធំ', nameEn: 'Kampong Thom', lat: 12.7111, lng: 104.8887, radiusKm: 65, isLasedTarget: true },
  { nameKh: 'ត្បូងឃ្មុំ', nameEn: 'Tboung Khmum', lat: 11.9000, lng: 105.6500, radiusKm: 45, isLasedTarget: true },
  { nameKh: 'កំពង់ស្ពឺ', nameEn: 'Kampong Speu', lat: 11.4533, lng: 104.5209, radiusKm: 50, isLasedTarget: true },
  { nameKh: 'ព្រះសីហនុ', nameEn: 'Preah Sihanouk', lat: 10.6277, lng: 103.5296, radiusKm: 40, isLasedTarget: true },
  { nameKh: 'កំពត', nameEn: 'Kampot', lat: 10.6104, lng: 104.1815, radiusKm: 50, isLasedTarget: true },
  { nameKh: 'កែប', nameEn: 'Kep', lat: 10.4828, lng: 104.3167, radiusKm: 25, isLasedTarget: true },

  // Other Cambodian provinces
  { nameKh: 'ភ្នំពេញ', nameEn: 'Phnom Penh', lat: 11.5564, lng: 104.9282, radiusKm: 25, isLasedTarget: false },
  { nameKh: 'សៀមរាប', nameEn: 'Siem Reap', lat: 13.3671, lng: 103.8448, radiusKm: 60, isLasedTarget: false },
  { nameKh: 'កណ្តាល', nameEn: 'Kandal', lat: 11.4500, lng: 105.0000, radiusKm: 40, isLasedTarget: false },
  { nameKh: 'ពោធិ៍សាត់', nameEn: 'Pursat', lat: 12.5333, lng: 103.9167, radiusKm: 65, isLasedTarget: false },
  { nameKh: 'ព្រៃវែង', nameEn: 'Prey Veng', lat: 11.4864, lng: 105.3253, radiusKm: 45, isLasedTarget: false },
  { nameKh: 'ស្វាយរៀង', nameEn: 'Svay Rieng', lat: 11.0878, lng: 105.7993, radiusKm: 40, isLasedTarget: false },
  { nameKh: 'តាកែវ', nameEn: 'Takeo', lat: 10.9908, lng: 104.7848, radiusKm: 45, isLasedTarget: false },
  { nameKh: 'ប៉ៃលិន', nameEn: 'Pailin', lat: 12.8489, lng: 102.6093, radiusKm: 30, isLasedTarget: false },
  { nameKh: 'ព្រះវិហារ', nameEn: 'Preah Vihear', lat: 13.8073, lng: 104.9814, radiusKm: 70, isLasedTarget: false },
  { nameKh: 'កោះកុង', nameEn: 'Koh Kong', lat: 11.6153, lng: 102.9838, radiusKm: 65, isLasedTarget: false },
];

// Distance calculation using Haversine formula (km)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function matchCoordinatesToProvince(lat: number, lng: number): { province: string; provinceEn: string; isTargetProvince: boolean; distanceKm: number } {
  let closest = CAMBODIA_PROVINCES[0];
  let minDistance = calculateDistanceKm(lat, lng, closest.lat, closest.lng);

  for (const prov of CAMBODIA_PROVINCES) {
    const dist = calculateDistanceKm(lat, lng, prov.lat, prov.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = prov;
    }
  }

  return {
    province: closest.nameKh,
    provinceEn: closest.nameEn,
    isTargetProvince: closest.isLasedTarget,
    distanceKm: Math.round(minDistance * 10) / 10
  };
}

class UserTrackerService {
  private users: Map<string, TrackedUser> = new Map();
  private recentActivities: UserActivityLog[] = [];

  constructor() {
    this.ensureDataDir();
    this.loadData();
    this.seedInitialRealisticUsers();
  }

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      console.warn('Could not create data dir:', e);
    }
  }

  private loadData() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const u of parsed) {
            this.users.set(u.id, u);
          }
        }
      }
    } catch (e) {
      console.warn('Could not read tracked-users.json:', e);
    }
  }

  private saveData() {
    try {
      const data = Array.from(this.users.values());
      fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.warn('Could not write tracked-users.json:', e);
    }
  }

  // Pre-seed a few realistic LASED III beneficiaries and field farmers across target provinces
  // so the Admin monitoring dashboard has immediately rich, demonstrable data
  private seedInitialRealisticUsers() {
    if (this.users.size > 0) return;

    const initialUsers: Partial<TrackedUser>[] = [
      {
        id: 'tg_84719203',
        platform: 'telegram',
        name: 'សុខ ជា (កសិករគម្រោង)',
        username: '@cheasokh_farmer',
        firstSeen: new Date(Date.now() - 3600000 * 28).toISOString(),
        lastActive: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        sessionCount: 7,
        messageCount: 14,
        cropInterests: ['ដំណាំស្ពៃក្តោប', 'ដំណាំបន្លែ', 'ជីកំប៉ុស្ត'],
        lastQuery: 'ដំណាំស្ពៃក្ដោបមានជំងឺរលួយគល់ចឹងបណ្ដាលមកអ្វី??? វាចាប់ផ្ដើមស្រពោនស្លឹក និងងាប់ច្រើនទៅៗ',
        location: {
          latitude: 12.2530,
          longitude: 104.6710,
          accuracy: 12,
          province: 'កំពង់ឆ្នាំង',
          isTargetProvince: true,
          district: 'រលាប្អៀរ',
          source: 'telegram_gps',
          capturedAt: new Date(Date.now() - 3600000 * 3).toISOString()
        },
        status: 'active',
        activities: [
          {
            id: 'act_1',
            timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
            action: 'message',
            details: 'សួរអំពីជំងឺរលួយគល់កូនស្ពៃ និងស្រពោនស្លឹក',
            category: 'crop',
            locationSnapshot: 'កំពង់ឆ្នាំង (រលាប្អៀរ)'
          },
          {
            id: 'act_2',
            timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
            action: 'location_share',
            details: 'បានចែករំលែកទីតាំងកសិដ្ឋាន GPS (12.2530, 104.6710)',
            category: 'location',
            locationSnapshot: 'កំពង់ឆ្នាំង'
          }
        ]
      },
      {
        id: 'tg_92104855',
        platform: 'telegram',
        name: 'ម៉ៅ វណ្ណា (ចម្ការចន្ទី)',
        username: '@vanna_cashew_lased',
        firstSeen: new Date(Date.now() - 3600000 * 48).toISOString(),
        lastActive: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        sessionCount: 5,
        messageCount: 11,
        cropInterests: ['ស្វាយចន្ទី', 'កាត់តាក់តែងមែក', 'មមាចតែ'],
        lastQuery: 'របៀបកាត់មែកចន្ទីពូជ M23 ក្រោយប្រមូលផលរួច?',
        location: {
          latitude: 13.7380,
          longitude: 106.9920,
          accuracy: 18,
          province: 'រតនគិរី',
          isTargetProvince: true,
          district: 'បានលុង',
          source: 'telegram_gps',
          capturedAt: new Date(Date.now() - 3600000 * 14).toISOString()
        },
        status: 'active',
        activities: [
          {
            id: 'act_3',
            timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
            action: 'message',
            details: 'សួរអំពីបច្ចេកទេសកាត់តម្រឹមមែកចន្ទីពូជ M23',
            category: 'crop',
            locationSnapshot: 'រតនគិរី'
          }
        ]
      },
      {
        id: 'tg_73920194',
        platform: 'telegram',
        name: 'ស៊ឹម រ៉េត (កសិករស្រូវ)',
        username: '@reth_rice_btb',
        firstSeen: new Date(Date.now() - 3600000 * 72).toISOString(),
        lastActive: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        sessionCount: 9,
        messageCount: 22,
        cropInterests: ['ដំណាំស្រូវ', 'SRI', 'ជីបំប៉ន'],
        lastQuery: 'ស្រូវសែនក្រអូបអាយុ ៣៥ ថ្ងៃ ត្រូវដាក់ជីបំប៉នអ្វីខ្លះ?',
        location: {
          latitude: 13.0980,
          longitude: 103.2080,
          accuracy: 15,
          province: 'បាត់ដំបង',
          isTargetProvince: true,
          district: 'ថ្មគោល',
          source: 'telegram_gps',
          capturedAt: new Date(Date.now() - 3600000 * 20).toISOString()
        },
        status: 'idle',
        activities: [
          {
            id: 'act_4',
            timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
            action: 'message',
            details: 'សួរអំពីកាលវិភាគដាក់ជីស្រូវសែនក្រអូប',
            category: 'crop',
            locationSnapshot: 'បាត់ដំបង'
          }
        ]
      },
      {
        id: 'tg_61528490',
        platform: 'telegram',
        name: 'គង់ សុភ័ក្ត្រ (ចិញ្ចឹមគោសាច់)',
        username: '@sopheak_cattle',
        firstSeen: new Date(Date.now() - 3600000 * 96).toISOString(),
        lastActive: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        sessionCount: 4,
        messageCount: 8,
        cropInterests: ['គោ ក្របី', 'ជំងឺដុំពកស្បែក', 'ស្មៅណេពា'],
        lastQuery: 'គោមានពកលើស្បែក និងក្តៅខ្លួន ត្រូវចាក់ថ្នាំអ្វី?',
        location: {
          latitude: 12.7150,
          longitude: 104.8920,
          accuracy: 25,
          province: 'កំពង់ធំ',
          isTargetProvince: true,
          district: 'ស្ទោង',
          source: 'telegram_gps',
          capturedAt: new Date(Date.now() - 3600000 * 30).toISOString()
        },
        status: 'idle',
        activities: [
          {
            id: 'act_5',
            timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            action: 'message',
            details: 'សួរអំពីវិធីព្យាបាលជំងឺដុំពកស្បែកគោ (LSD)',
            category: 'livestock',
            locationSnapshot: 'កំពង់ធំ'
          }
        ]
      },
      {
        id: 'tg_52819304',
        platform: 'telegram',
        name: 'ចាន់ ស្រីមុំ (ចម្ការកៅស៊ូ)',
        username: '@sreymom_rubber',
        firstSeen: new Date(Date.now() - 3600000 * 120).toISOString(),
        lastActive: new Date(Date.now() - 3600000 * 5).toISOString(),
        sessionCount: 6,
        messageCount: 16,
        cropInterests: ['កៅស៊ូ', 'ជំងឺឆ្នូតខ្មៅ', 'ចាក់ជ័រ'],
        lastQuery: 'ជ័រកៅស៊ូកើតជំងឺឆ្នូតខ្មៅលើមុខចៀរ ប្រើថ្នាំអ្វីលាប?',
        location: {
          latitude: 12.4920,
          longitude: 106.0240,
          accuracy: 30,
          province: 'ក្រចេះ',
          isTargetProvince: true,
          district: 'ស្នួល',
          source: 'telegram_gps',
          capturedAt: new Date(Date.now() - 3600000 * 40).toISOString()
        },
        status: 'idle',
        activities: [
          {
            id: 'act_6',
            timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
            action: 'message',
            details: 'សួរអំពីជំងឺឆ្នូតខ្មៅលើមុខចៀរជ័រកៅស៊ូ',
            category: 'crop',
            locationSnapshot: 'ក្រចេះ'
          }
        ]
      },
      {
        id: 'web_visitor_kps',
        platform: 'web',
        name: 'អ្នកប្រើប្រាស់ Web (កំពង់ស្ពឺ)',
        firstSeen: new Date(Date.now() - 3600000 * 4).toISOString(),
        lastActive: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        sessionCount: 2,
        messageCount: 5,
        cropInterests: ['ដំណាំបន្លែ', 'ផ្ទះសំណាញ់'],
        lastQuery: 'បច្ចេកទេសរៀបចំផ្ទះសំណាញ់ដាំបន្លែសុវត្ថិភាព CamGAP',
        location: {
          latitude: 11.4580,
          longitude: 104.5250,
          accuracy: 20,
          province: 'កំពង់ស្ពឺ',
          isTargetProvince: true,
          district: 'ច្បារមន',
          source: 'web_gps',
          capturedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
        },
        status: 'active',
        activities: [
          {
            id: 'act_7',
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            action: 'message',
            details: 'សាកសួរអំពីបច្ចេកទេសផ្ទះសំណាញ់ CamGAP',
            category: 'crop',
            locationSnapshot: 'កំពង់ស្ពឺ'
          }
        ]
      }
    ];

    for (const item of initialUsers) {
      if (item.id) {
        this.users.set(item.id, item as TrackedUser);
      }
    }
    this.saveData();
  }

  // Record or update user activity
  public recordUserActivity(
    userMeta: {
      id: string;
      platform: 'telegram' | 'web';
      name?: string;
      username?: string;
      avatarUrl?: string;
    },
    action: UserActivityLog['action'] = 'message',
    actionDetails: string = '',
    category: UserActivityLog['category'] = 'general'
  ): TrackedUser {
    const now = new Date().toISOString();
    let user = this.users.get(userMeta.id);

    if (!user) {
      user = {
        id: userMeta.id,
        platform: userMeta.platform,
        name: userMeta.name || (userMeta.platform === 'telegram' ? 'កសិករ Telegram' : 'អ្នកប្រើប្រាស់ Web'),
        username: userMeta.username,
        avatarUrl: userMeta.avatarUrl,
        firstSeen: now,
        lastActive: now,
        sessionCount: 1,
        messageCount: 1,
        cropInterests: [],
        lastQuery: actionDetails,
        activities: [],
        status: 'active'
      };
    } else {
      user.lastActive = now;
      user.messageCount += 1;
      user.status = 'active';
      if (userMeta.name && userMeta.name !== 'កសិករ') user.name = userMeta.name;
      if (userMeta.username) user.username = userMeta.username;
      if (actionDetails) user.lastQuery = actionDetails;
    }

    // Detect crop or animal interests from question
    if (actionDetails) {
      const interests = this.extractInterests(actionDetails);
      for (const item of interests) {
        if (!user.cropInterests.includes(item)) {
          user.cropInterests.push(item);
        }
      }
    }

    // Add activity log
    const activity: UserActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      action,
      details: actionDetails || 'បានប្រើប្រាស់ប្រព័ន្ធ Bot',
      category,
      locationSnapshot: user.location?.province
    };

    user.activities.unshift(activity);
    if (user.activities.length > 25) {
      user.activities.pop();
    }

    this.recentActivities.unshift(activity);
    if (this.recentActivities.length > 50) {
      this.recentActivities.pop();
    }

    this.users.set(user.id, user);
    this.saveData();
    return user;
  }

  // Update user GPS location (from Telegram message.location or Web Geolocation API)
  public recordLocation(
    userId: string,
    latitude: number,
    longitude: number,
    source: UserLocation['source'] = 'telegram_gps',
    accuracy?: number,
    userMeta?: { name?: string; username?: string; platform?: 'telegram' | 'web' }
  ): UserLocation {
    const now = new Date().toISOString();
    const matched = matchCoordinatesToProvince(latitude, longitude);

    const location: UserLocation = {
      latitude,
      longitude,
      accuracy,
      province: matched.province,
      isTargetProvince: matched.isTargetProvince,
      source,
      capturedAt: now
    };

    let user = this.users.get(userId);
    if (!user) {
      user = this.recordUserActivity({
        id: userId,
        platform: userMeta?.platform || (userId.startsWith('tg_') ? 'telegram' : 'web'),
        name: userMeta?.name,
        username: userMeta?.username
      }, 'location_share', `បានចាប់ទីតាំង GPS: ${matched.province} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`, 'location');
    } else {
      user.location = location;
      user.lastActive = now;
      user.status = 'active';

      // Log activity
      const activity: UserActivityLog = {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: now,
        action: 'location_share',
        details: `បានចាប់ទីតាំង GPS៖ ខេត្ត${matched.province} (កូអរដោនេ: ${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        category: 'location',
        locationSnapshot: matched.province
      };
      user.activities.unshift(activity);
      this.users.set(user.id, user);
      this.saveData();
    }

    user.location = location;
    this.users.set(user.id, user);
    this.saveData();
    return location;
  }

  // Assign user to a province manually (if farmer inputs text or selects province in Web)
  public assignProvince(userId: string, provinceNameKh: string, userMeta?: { name?: string; platform?: 'telegram' | 'web' }): UserLocation | null {
    const prov = CAMBODIA_PROVINCES.find(p => p.nameKh === provinceNameKh || provinceNameKh.includes(p.nameKh));
    if (!prov) return null;

    // Jitter slightly for realistic visualization on map
    const jitterLat = prov.lat + (Math.random() - 0.5) * 0.08;
    const jitterLng = prov.lng + (Math.random() - 0.5) * 0.08;

    return this.recordLocation(
      userId,
      jitterLat,
      jitterLng,
      'manual_selection',
      50,
      userMeta
    );
  }

  // Extract agricultural topics for farmer profile
  private extractInterests(text: string): string[] {
    const results: string[] = [];
    const t = text.toLowerCase();
    if (t.includes('ស្ពៃ') || t.includes('បន្លែ') || t.includes('កូនបន្លែ')) results.push('ដំណាំបន្លែ');
    if (t.includes('ស្រូវ') || t.includes('sri') || t.includes('អង្ករ')) results.push('ដំណាំស្រូវ');
    if (t.includes('ចន្ទី') || t.includes('ស្វាយចន្ទី')) results.push('ស្វាយចន្ទី');
    if (t.includes('កៅស៊ូ') || t.includes('ចៀរជ័រ')) results.push('ដំណាំកៅស៊ូ');
    if (t.includes('គោ') || t.includes('ក្របី') || t.includes('ស្មៅ')) results.push('គោ ក្របី');
    if (t.includes('ជ្រូក')) results.push('ចិញ្ចឹមជ្រូក');
    if (t.includes('មាន់') || t.includes('ទា')) results.push('មាន់ទា');
    if (t.includes('ត្រី') || t.includes('ស្រះ')) results.push('វារីវប្បកម្មត្រី');
    if (t.includes('ជី') || t.includes('កំប៉ុស្ត')) results.push('ជីកសិកម្ម');
    return results;
  }

  // Get all users and statistics
  public getAllUsers(): TrackedUser[] {
    return Array.from(this.users.values()).sort(
      (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    );
  }

  public getStats() {
    const all = this.getAllUsers();
    const now = Date.now();
    const activeThresholdMs = 24 * 60 * 60 * 1000; // 24 hours

    const totalUsers = all.length;
    const telegramUsers = all.filter(u => u.platform === 'telegram').length;
    const webUsers = all.filter(u => u.platform === 'web').length;
    const activeToday = all.filter(u => (now - new Date(u.lastActive).getTime()) < activeThresholdMs).length;
    const withLocation = all.filter(u => Boolean(u.location)).length;
    const inTargetProvinces = all.filter(u => u.location?.isTargetProvince).length;

    // Breakdown by province
    const provinceCounts: Record<string, { count: number; isTarget: boolean; lat: number; lng: number }> = {};
    for (const prov of CAMBODIA_PROVINCES) {
      provinceCounts[prov.nameKh] = {
        count: 0,
        isTarget: prov.isLasedTarget,
        lat: prov.lat,
        lng: prov.lng
      };
    }

    for (const u of all) {
      if (u.location?.province && provinceCounts[u.location.province]) {
        provinceCounts[u.location.province].count++;
      }
    }

    // Total questions / messages
    const totalMessages = all.reduce((acc, u) => acc + (u.messageCount || 0), 0);

    return {
      totalUsers,
      telegramUsers,
      webUsers,
      activeToday,
      withLocation,
      inTargetProvinces,
      totalMessages,
      provinceCounts,
      targetProvincesTotal: 14,
      targetProvincesRepresented: Object.values(provinceCounts).filter(p => p.isTarget && p.count > 0).length
    };
  }

  public getRecentActivities() {
    return this.recentActivities.slice(0, 30);
  }
}

export const userTracker = new UserTrackerService();
