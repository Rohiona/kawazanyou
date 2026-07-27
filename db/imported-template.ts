import type { MonthlyPlan } from "../lib/budget";
import { mergeMizuhoOjiAllocations } from "../lib/allocation-account-merge.ts";
import {
  DEFAULT_SIMPLIFIED_TAX_CATEGORY,
  STANDARD_CONSUMPTION_TAX_PERCENT,
} from "../lib/consumption-tax.ts";
import { synchronizeMonthlyPlan } from "../lib/plan-calculations.ts";

const imported2026TemplateSource: Array<
  Omit<MonthlyPlan, "simplifiedTaxCategory">
> = [
  {
    "year": 2026,
    "month": 1,
    "grossIncome": 900000,
    "taxReservePercent": 30,
    "consumptionTaxPercent": 5,
    "householdItems": [
      {
        "id": "household-1-1",
        "name": "家賃＋駐車場",
        "budget": 115770
      },
      {
        "id": "household-1-2",
        "name": "水道代",
        "budget": 10000
      },
      {
        "id": "household-1-3",
        "name": "ガス代",
        "budget": 10000
      },
      {
        "id": "household-1-4",
        "name": "電気代",
        "budget": 12000
      },
      {
        "id": "household-1-5",
        "name": "食費",
        "budget": 50000
      },
      {
        "id": "household-1-6",
        "name": "日用品",
        "budget": 30000
      },
      {
        "id": "household-1-7",
        "name": "携帯代",
        "budget": 25000
      },
      {
        "id": "household-1-8",
        "name": "インターネット",
        "budget": 4536
      },
      {
        "id": "household-1-9",
        "name": "車の保険",
        "budget": 2450
      },
      {
        "id": "household-1-10",
        "name": "お小遣い（直）",
        "budget": 60000
      },
      {
        "id": "household-1-11",
        "name": "お小遣い（幸）",
        "budget": 60000
      },
      {
        "id": "household-1-12",
        "name": "コンタクト積立",
        "budget": 10000
      },
      {
        "id": "household-1-13",
        "name": "化粧品積立",
        "budget": 20000
      },
      {
        "id": "household-1-14",
        "name": "生命保険など",
        "budget": 10000
      },
      {
        "id": "household-1-15",
        "name": "ジム",
        "budget": 14000
      },
      {
        "id": "household-1-16",
        "name": "交通費",
        "budget": 8700
      },
      {
        "id": "household-1-17",
        "name": "投資積立",
        "budget": 3000
      },
      {
        "id": "household-1-18",
        "name": "家族貯金",
        "budget": 60000
      }
    ],
    "paymentItems": [
      {
        "id": "payment-1-1",
        "name": "カード代",
        "budget": 82686,
        "actual": 77466
      },
      {
        "id": "payment-1-2",
        "name": "家賃",
        "budget": 115756,
        "actual": 115756
      },
      {
        "id": "payment-1-3",
        "name": "積立投資",
        "budget": 3000,
        "actual": 3000
      },
      {
        "id": "payment-1-4",
        "name": "ジム",
        "budget": 12070,
        "actual": 12070
      },
      {
        "id": "payment-1-5",
        "name": "水道代",
        "budget": 10000,
        "actual": 0
      },
      {
        "id": "payment-1-6",
        "name": "ガス代",
        "budget": 10000,
        "actual": 7185
      },
      {
        "id": "payment-1-7",
        "name": "電気代",
        "budget": 12000,
        "actual": 4768
      },
      {
        "id": "payment-1-8",
        "name": "AI",
        "budget": 20000,
        "actual": 20000
      }
    ],
    "allocationItems": [
      {
        "id": "allocation-1-1",
        "name": "みずほ（青山）",
        "amount": 312857
      },
      {
        "id": "allocation-1-2",
        "name": "みずほ（王子）",
        "amount": 92536
      },
      {
        "id": "allocation-1-3",
        "name": "みずほ（川越）",
        "amount": 60000
      },
      {
        "id": "allocation-1-4",
        "name": "ソニー銀行",
        "amount": 60000
      },
      {
        "id": "allocation-1-5",
        "name": "ゆうちょ",
        "amount": 0
      },
      {
        "id": "allocation-1-6",
        "name": "手渡し",
        "amount": 160000
      },
      {
        "id": "allocation-1-7",
        "name": "インデックス投資",
        "amount": 0
      }
    ],
    "memo": "皮算用_2026.xlsxから移行",
    "updatedAt": "2026-07-27T00:00:00.000Z"
  },
  {
    "year": 2026,
    "month": 2,
    "grossIncome": 900000,
    "taxReservePercent": 30,
    "consumptionTaxPercent": 5,
    "householdItems": [
      {
        "id": "household-2-1",
        "name": "家賃＋駐車場",
        "budget": 115770
      },
      {
        "id": "household-2-2",
        "name": "水道代",
        "budget": 10000
      },
      {
        "id": "household-2-3",
        "name": "ガス代",
        "budget": 10000
      },
      {
        "id": "household-2-4",
        "name": "電気代",
        "budget": 12000
      },
      {
        "id": "household-2-5",
        "name": "食費",
        "budget": 50000
      },
      {
        "id": "household-2-6",
        "name": "日用品",
        "budget": 30000
      },
      {
        "id": "household-2-7",
        "name": "携帯代",
        "budget": 25000
      },
      {
        "id": "household-2-8",
        "name": "インターネット",
        "budget": 4536
      },
      {
        "id": "household-2-9",
        "name": "車の保険",
        "budget": 2450
      },
      {
        "id": "household-2-10",
        "name": "お小遣い（直）",
        "budget": 60000
      },
      {
        "id": "household-2-11",
        "name": "お小遣い（幸）",
        "budget": 60000
      },
      {
        "id": "household-2-12",
        "name": "コンタクト積立",
        "budget": 10000
      },
      {
        "id": "household-2-13",
        "name": "化粧品積立",
        "budget": 20000
      },
      {
        "id": "household-2-14",
        "name": "生命保険など",
        "budget": 10000
      },
      {
        "id": "household-2-15",
        "name": "ジム",
        "budget": 14000
      },
      {
        "id": "household-2-16",
        "name": "交通費",
        "budget": 8700
      },
      {
        "id": "household-2-17",
        "name": "投資積立",
        "budget": 3000
      },
      {
        "id": "household-2-18",
        "name": "家族貯金",
        "budget": 60000
      }
    ],
    "paymentItems": [
      {
        "id": "payment-2-1",
        "name": "カード代",
        "budget": 82686,
        "actual": 142203
      },
      {
        "id": "payment-2-2",
        "name": "家賃",
        "budget": 115756,
        "actual": 115756
      },
      {
        "id": "payment-2-3",
        "name": "積立投資",
        "budget": 3000,
        "actual": 3000
      },
      {
        "id": "payment-2-4",
        "name": "ジム",
        "budget": 12070,
        "actual": 12070
      },
      {
        "id": "payment-2-5",
        "name": "水道代",
        "budget": 10000,
        "actual": 0
      },
      {
        "id": "payment-2-6",
        "name": "ガス代",
        "budget": 10000,
        "actual": 7185
      },
      {
        "id": "payment-2-7",
        "name": "電気代",
        "budget": 12000,
        "actual": 4768
      },
      {
        "id": "payment-2-8",
        "name": "AI",
        "budget": 20000,
        "actual": 20000
      }
    ],
    "allocationItems": [
      {
        "id": "allocation-2-1",
        "name": "みずほ（青山）",
        "amount": 312857
      },
      {
        "id": "allocation-2-2",
        "name": "みずほ（王子）",
        "amount": 157273
      },
      {
        "id": "allocation-2-3",
        "name": "みずほ（川越）",
        "amount": 50000
      },
      {
        "id": "allocation-2-4",
        "name": "ソニー銀行",
        "amount": 60000
      },
      {
        "id": "allocation-2-5",
        "name": "ゆうちょ",
        "amount": 0
      },
      {
        "id": "allocation-2-6",
        "name": "手渡し",
        "amount": 170000
      },
      {
        "id": "allocation-2-7",
        "name": "インデックス投資",
        "amount": 0
      }
    ],
    "memo": "皮算用_2026.xlsxから移行",
    "updatedAt": "2026-07-27T00:00:00.000Z"
  },
  {
    "year": 2026,
    "month": 3,
    "grossIncome": 900000,
    "taxReservePercent": 30,
    "consumptionTaxPercent": 5,
    "householdItems": [
      {
        "id": "household-3-1",
        "name": "家賃＋駐車場",
        "budget": 115770
      },
      {
        "id": "household-3-2",
        "name": "水道代",
        "budget": 10000
      },
      {
        "id": "household-3-3",
        "name": "ガス代",
        "budget": 10000
      },
      {
        "id": "household-3-4",
        "name": "電気代",
        "budget": 12000
      },
      {
        "id": "household-3-5",
        "name": "食費",
        "budget": 50000
      },
      {
        "id": "household-3-6",
        "name": "日用品",
        "budget": 30000
      },
      {
        "id": "household-3-7",
        "name": "携帯代",
        "budget": 25000
      },
      {
        "id": "household-3-8",
        "name": "インターネット",
        "budget": 4536
      },
      {
        "id": "household-3-9",
        "name": "車の保険",
        "budget": 2450
      },
      {
        "id": "household-3-10",
        "name": "お小遣い（直）",
        "budget": 60000
      },
      {
        "id": "household-3-11",
        "name": "お小遣い（幸）",
        "budget": 60000
      },
      {
        "id": "household-3-12",
        "name": "コンタクト積立",
        "budget": 10000
      },
      {
        "id": "household-3-13",
        "name": "化粧品積立",
        "budget": 20000
      },
      {
        "id": "household-3-14",
        "name": "生命保険など",
        "budget": 10000
      },
      {
        "id": "household-3-15",
        "name": "ジム",
        "budget": 14000
      },
      {
        "id": "household-3-16",
        "name": "交通費",
        "budget": 8700
      },
      {
        "id": "household-3-17",
        "name": "投資積立",
        "budget": 3000
      },
      {
        "id": "household-3-18",
        "name": "家族貯金",
        "budget": 60000
      }
    ],
    "paymentItems": [
      {
        "id": "payment-3-1",
        "name": "カード代",
        "budget": 82686,
        "actual": 59134
      },
      {
        "id": "payment-3-2",
        "name": "家賃",
        "budget": 115756,
        "actual": 115756
      },
      {
        "id": "payment-3-3",
        "name": "積立投資",
        "budget": 3000,
        "actual": 3000
      },
      {
        "id": "payment-3-4",
        "name": "ジム",
        "budget": 12070,
        "actual": 12070
      },
      {
        "id": "payment-3-5",
        "name": "水道代",
        "budget": 10000,
        "actual": 0
      },
      {
        "id": "payment-3-6",
        "name": "ガス代",
        "budget": 10000,
        "actual": 7185
      },
      {
        "id": "payment-3-7",
        "name": "電気代",
        "budget": 12000,
        "actual": 4768
      },
      {
        "id": "payment-3-8",
        "name": "AI",
        "budget": 20000,
        "actual": 20000
      }
    ],
    "allocationItems": [
      {
        "id": "allocation-3-1",
        "name": "みずほ（青山）",
        "amount": 312857
      },
      {
        "id": "allocation-3-2",
        "name": "みずほ（王子）",
        "amount": 74204
      },
      {
        "id": "allocation-3-3",
        "name": "みずほ（川越）",
        "amount": 50000
      },
      {
        "id": "allocation-3-4",
        "name": "ソニー銀行",
        "amount": 60000
      },
      {
        "id": "allocation-3-5",
        "name": "ゆうちょ",
        "amount": 0
      },
      {
        "id": "allocation-3-6",
        "name": "手渡し",
        "amount": 170000
      },
      {
        "id": "allocation-3-7",
        "name": "インデックス投資",
        "amount": 0
      }
    ],
    "memo": "皮算用_2026.xlsxから移行",
    "updatedAt": "2026-07-27T00:00:00.000Z"
  },
  {
    "year": 2026,
    "month": 4,
    "grossIncome": 902000,
    "taxReservePercent": 30,
    "consumptionTaxPercent": 5,
    "householdItems": [
      {
        "id": "household-4-1",
        "name": "家賃＋駐車場",
        "budget": 115770
      },
      {
        "id": "household-4-2",
        "name": "水道代",
        "budget": 10000
      },
      {
        "id": "household-4-3",
        "name": "ガス代",
        "budget": 10000
      },
      {
        "id": "household-4-4",
        "name": "電気代",
        "budget": 12000
      },
      {
        "id": "household-4-5",
        "name": "食費",
        "budget": 50000
      },
      {
        "id": "household-4-6",
        "name": "日用品",
        "budget": 30000
      },
      {
        "id": "household-4-7",
        "name": "携帯代",
        "budget": 25000
      },
      {
        "id": "household-4-8",
        "name": "インターネット",
        "budget": 4536
      },
      {
        "id": "household-4-9",
        "name": "車の保険",
        "budget": 2450
      },
      {
        "id": "household-4-10",
        "name": "お小遣い（直）",
        "budget": 60000
      },
      {
        "id": "household-4-11",
        "name": "お小遣い（幸）",
        "budget": 60000
      },
      {
        "id": "household-4-12",
        "name": "コンタクト積立",
        "budget": 10000
      },
      {
        "id": "household-4-13",
        "name": "化粧品積立",
        "budget": 20000
      },
      {
        "id": "household-4-14",
        "name": "生命保険など",
        "budget": 10000
      },
      {
        "id": "household-4-15",
        "name": "ジム",
        "budget": 14000
      },
      {
        "id": "household-4-16",
        "name": "交通費",
        "budget": 8700
      },
      {
        "id": "household-4-17",
        "name": "投資積立",
        "budget": 3000
      },
      {
        "id": "household-4-18",
        "name": "家族貯金",
        "budget": 60000
      }
    ],
    "paymentItems": [
      {
        "id": "payment-4-1",
        "name": "カード代",
        "budget": 82686,
        "actual": 75107
      },
      {
        "id": "payment-4-2",
        "name": "家賃",
        "budget": 115756,
        "actual": 115756
      },
      {
        "id": "payment-4-3",
        "name": "積立投資",
        "budget": 3000,
        "actual": 3000
      },
      {
        "id": "payment-4-4",
        "name": "ジム",
        "budget": 12070,
        "actual": 12070
      },
      {
        "id": "payment-4-5",
        "name": "水道代",
        "budget": 10000,
        "actual": 0
      },
      {
        "id": "payment-4-6",
        "name": "ガス代",
        "budget": 10000,
        "actual": 7185
      },
      {
        "id": "payment-4-7",
        "name": "電気代",
        "budget": 12000,
        "actual": 4768
      },
      {
        "id": "payment-4-8",
        "name": "AI",
        "budget": 20000,
        "actual": 20000
      }
    ],
    "allocationItems": [
      {
        "id": "allocation-4-1",
        "name": "みずほ（青山）",
        "amount": 313952
      },
      {
        "id": "allocation-4-2",
        "name": "みずほ（王子）",
        "amount": 90177
      },
      {
        "id": "allocation-4-3",
        "name": "みずほ（川越）",
        "amount": 50000
      },
      {
        "id": "allocation-4-4",
        "name": "ソニー銀行",
        "amount": 60000
      },
      {
        "id": "allocation-4-5",
        "name": "ゆうちょ",
        "amount": 0
      },
      {
        "id": "allocation-4-6",
        "name": "手渡し",
        "amount": 170000
      },
      {
        "id": "allocation-4-7",
        "name": "インデックス投資",
        "amount": 0
      }
    ],
    "memo": "皮算用_2026.xlsxから移行",
    "updatedAt": "2026-07-27T00:00:00.000Z"
  },
  {
    "year": 2026,
    "month": 5,
    "grossIncome": 1084100,
    "taxReservePercent": 30,
    "consumptionTaxPercent": 5,
    "householdItems": [
      {
        "id": "household-5-1",
        "name": "家賃＋駐車場",
        "budget": 115770
      },
      {
        "id": "household-5-2",
        "name": "水道代",
        "budget": 10000
      },
      {
        "id": "household-5-3",
        "name": "ガス代",
        "budget": 10000
      },
      {
        "id": "household-5-4",
        "name": "電気代",
        "budget": 12000
      },
      {
        "id": "household-5-5",
        "name": "食費",
        "budget": 50000
      },
      {
        "id": "household-5-6",
        "name": "日用品",
        "budget": 30000
      },
      {
        "id": "household-5-7",
        "name": "携帯代",
        "budget": 25000
      },
      {
        "id": "household-5-8",
        "name": "インターネット",
        "budget": 4536
      },
      {
        "id": "household-5-9",
        "name": "車の保険",
        "budget": 2450
      },
      {
        "id": "household-5-10",
        "name": "お小遣い（直）",
        "budget": 60000
      },
      {
        "id": "household-5-11",
        "name": "お小遣い（幸）",
        "budget": 60000
      },
      {
        "id": "household-5-12",
        "name": "コンタクト積立",
        "budget": 10000
      },
      {
        "id": "household-5-13",
        "name": "化粧品積立",
        "budget": 20000
      },
      {
        "id": "household-5-14",
        "name": "生命保険など",
        "budget": 10000
      },
      {
        "id": "household-5-15",
        "name": "ジム",
        "budget": 14000
      },
      {
        "id": "household-5-16",
        "name": "交通費",
        "budget": 8700
      },
      {
        "id": "household-5-17",
        "name": "投資積立",
        "budget": 3000
      },
      {
        "id": "household-5-18",
        "name": "家族貯金",
        "budget": 60000
      }
    ],
    "paymentItems": [
      {
        "id": "payment-5-1",
        "name": "カード代",
        "budget": 82686,
        "actual": 79681
      },
      {
        "id": "payment-5-2",
        "name": "家賃",
        "budget": 115756,
        "actual": 115756
      },
      {
        "id": "payment-5-3",
        "name": "積立投資",
        "budget": 3000,
        "actual": 3000
      },
      {
        "id": "payment-5-4",
        "name": "ジム",
        "budget": 12070,
        "actual": 12070
      },
      {
        "id": "payment-5-5",
        "name": "水道代",
        "budget": 10000,
        "actual": 0
      },
      {
        "id": "payment-5-6",
        "name": "ガス代",
        "budget": 10000,
        "actual": 7185
      },
      {
        "id": "payment-5-7",
        "name": "電気代",
        "budget": 12000,
        "actual": 4768
      },
      {
        "id": "payment-5-8",
        "name": "AI",
        "budget": 20000,
        "actual": 20000
      }
    ],
    "allocationItems": [
      {
        "id": "allocation-5-1",
        "name": "みずほ（青山）",
        "amount": 377624
      },
      {
        "id": "allocation-5-2",
        "name": "みずほ（王子）",
        "amount": 94751
      },
      {
        "id": "allocation-5-3",
        "name": "みずほ（川越）",
        "amount": 50000
      },
      {
        "id": "allocation-5-4",
        "name": "ソニー銀行",
        "amount": 60000
      },
      {
        "id": "allocation-5-5",
        "name": "ゆうちょ",
        "amount": 0
      },
      {
        "id": "allocation-5-6",
        "name": "手渡し",
        "amount": 170000
      },
      {
        "id": "allocation-5-7",
        "name": "インデックス投資",
        "amount": 50000
      }
    ],
    "memo": "皮算用_2026.xlsxから移行",
    "updatedAt": "2026-07-27T00:00:00.000Z"
  },
  {
    "year": 2026,
    "month": 6,
    "grossIncome": 953828,
    "taxReservePercent": 30,
    "consumptionTaxPercent": 5,
    "householdItems": [
      {
        "id": "household-6-1",
        "name": "家賃＋駐車場",
        "budget": 115770
      },
      {
        "id": "household-6-2",
        "name": "水道代",
        "budget": 10000
      },
      {
        "id": "household-6-3",
        "name": "ガス代",
        "budget": 10000
      },
      {
        "id": "household-6-4",
        "name": "電気代",
        "budget": 12000
      },
      {
        "id": "household-6-5",
        "name": "食費",
        "budget": 50000
      },
      {
        "id": "household-6-6",
        "name": "日用品",
        "budget": 30000
      },
      {
        "id": "household-6-7",
        "name": "携帯代",
        "budget": 25000
      },
      {
        "id": "household-6-8",
        "name": "インターネット",
        "budget": 4536
      },
      {
        "id": "household-6-9",
        "name": "車の保険",
        "budget": 2450
      },
      {
        "id": "household-6-10",
        "name": "お小遣い（直）",
        "budget": 60000
      },
      {
        "id": "household-6-11",
        "name": "お小遣い（幸）",
        "budget": 60000
      },
      {
        "id": "household-6-12",
        "name": "コンタクト積立",
        "budget": 10000
      },
      {
        "id": "household-6-13",
        "name": "化粧品積立",
        "budget": 20000
      },
      {
        "id": "household-6-14",
        "name": "生命保険など",
        "budget": 10000
      },
      {
        "id": "household-6-15",
        "name": "ジム",
        "budget": 14000
      },
      {
        "id": "household-6-16",
        "name": "交通費",
        "budget": 8700
      },
      {
        "id": "household-6-17",
        "name": "投資積立",
        "budget": 3000
      },
      {
        "id": "household-6-18",
        "name": "家族貯金",
        "budget": 60000
      }
    ],
    "paymentItems": [
      {
        "id": "payment-6-1",
        "name": "カード代",
        "budget": 82686,
        "actual": 72213
      },
      {
        "id": "payment-6-2",
        "name": "家賃",
        "budget": 115756,
        "actual": 115756
      },
      {
        "id": "payment-6-3",
        "name": "積立投資",
        "budget": 3000,
        "actual": 3000
      },
      {
        "id": "payment-6-4",
        "name": "ジム",
        "budget": 12070,
        "actual": 12070
      },
      {
        "id": "payment-6-5",
        "name": "水道代",
        "budget": 10000,
        "actual": 0
      },
      {
        "id": "payment-6-6",
        "name": "ガス代",
        "budget": 10000,
        "actual": 7185
      },
      {
        "id": "payment-6-7",
        "name": "電気代",
        "budget": 12000,
        "actual": 4768
      },
      {
        "id": "payment-6-8",
        "name": "AI",
        "budget": 36000,
        "actual": 36000
      }
    ],
    "allocationItems": [
      {
        "id": "allocation-6-1",
        "name": "みずほ（青山）",
        "amount": 332420
      },
      {
        "id": "allocation-6-2",
        "name": "みずほ（王子）",
        "amount": 87283
      },
      {
        "id": "allocation-6-3",
        "name": "みずほ（川越）",
        "amount": 20000
      },
      {
        "id": "allocation-6-4",
        "name": "ソニー銀行",
        "amount": 60000
      },
      {
        "id": "allocation-6-5",
        "name": "ゆうちょ",
        "amount": 0
      },
      {
        "id": "allocation-6-6",
        "name": "手渡し",
        "amount": 170000
      },
      {
        "id": "allocation-6-7",
        "name": "インデックス投資",
        "amount": 50000
      }
    ],
    "memo": "皮算用_2026.xlsxから移行",
    "updatedAt": "2026-07-27T00:00:00.000Z"
  },
  {
    "year": 2026,
    "month": 7,
    "grossIncome": 1129021,
    "taxReservePercent": 30,
    "consumptionTaxPercent": 5,
    "householdItems": [
      {
        "id": "household-7-1",
        "name": "家賃＋駐車場",
        "budget": 115770
      },
      {
        "id": "household-7-2",
        "name": "水道代",
        "budget": 10000
      },
      {
        "id": "household-7-3",
        "name": "ガス代",
        "budget": 10000
      },
      {
        "id": "household-7-4",
        "name": "電気代",
        "budget": 12000
      },
      {
        "id": "household-7-5",
        "name": "食費",
        "budget": 50000
      },
      {
        "id": "household-7-6",
        "name": "日用品",
        "budget": 30000
      },
      {
        "id": "household-7-7",
        "name": "携帯代",
        "budget": 25000
      },
      {
        "id": "household-7-8",
        "name": "インターネット",
        "budget": 4536
      },
      {
        "id": "household-7-9",
        "name": "車の保険",
        "budget": 2450
      },
      {
        "id": "household-7-10",
        "name": "お小遣い（直）",
        "budget": 60000
      },
      {
        "id": "household-7-11",
        "name": "お小遣い（幸）",
        "budget": 60000
      },
      {
        "id": "household-7-12",
        "name": "コンタクト積立",
        "budget": 10000
      },
      {
        "id": "household-7-13",
        "name": "化粧品積立",
        "budget": 20000
      },
      {
        "id": "household-7-14",
        "name": "生命保険など",
        "budget": 10000
      },
      {
        "id": "household-7-15",
        "name": "ジム",
        "budget": 14000
      },
      {
        "id": "household-7-16",
        "name": "交通費",
        "budget": 8700
      },
      {
        "id": "household-7-17",
        "name": "投資積立",
        "budget": 3000
      },
      {
        "id": "household-7-18",
        "name": "家族貯金",
        "budget": 60000
      }
    ],
    "paymentItems": [
      {
        "id": "payment-7-1",
        "name": "カード代",
        "budget": 82686,
        "actual": 103392
      },
      {
        "id": "payment-7-2",
        "name": "家賃",
        "budget": 115756,
        "actual": 115756
      },
      {
        "id": "payment-7-3",
        "name": "積立投資",
        "budget": 3000,
        "actual": 3000
      },
      {
        "id": "payment-7-4",
        "name": "ジム",
        "budget": 12070,
        "actual": 12070
      },
      {
        "id": "payment-7-5",
        "name": "水道代",
        "budget": 10000,
        "actual": 0
      },
      {
        "id": "payment-7-6",
        "name": "ガス代",
        "budget": 10000,
        "actual": 7185
      },
      {
        "id": "payment-7-7",
        "name": "電気代",
        "budget": 12000,
        "actual": 4768
      },
      {
        "id": "payment-7-8",
        "name": "AI",
        "budget": 20000,
        "actual": 20000
      }
    ],
    "allocationItems": [
      {
        "id": "allocation-7-1",
        "name": "みずほ（青山）",
        "amount": 392763
      },
      {
        "id": "allocation-7-2",
        "name": "みずほ（王子）",
        "amount": 118462
      },
      {
        "id": "allocation-7-3",
        "name": "みずほ（川越）",
        "amount": 50000
      },
      {
        "id": "allocation-7-4",
        "name": "ソニー銀行",
        "amount": 60000
      },
      {
        "id": "allocation-7-5",
        "name": "ゆうちょ",
        "amount": 0
      },
      {
        "id": "allocation-7-6",
        "name": "手渡し",
        "amount": 170000
      },
      {
        "id": "allocation-7-7",
        "name": "インデックス投資",
        "amount": 50000
      }
    ],
    "memo": "皮算用_2026.xlsxから移行",
    "updatedAt": "2026-07-27T00:00:00.000Z"
  },
  {
    "year": 2026,
    "month": 8,
    "grossIncome": 900000,
    "taxReservePercent": 30,
    "consumptionTaxPercent": 5,
    "householdItems": [
      {
        "id": "household-8-1",
        "name": "家賃＋駐車場",
        "budget": 115770
      },
      {
        "id": "household-8-2",
        "name": "水道代",
        "budget": 10000
      },
      {
        "id": "household-8-3",
        "name": "ガス代",
        "budget": 10000
      },
      {
        "id": "household-8-4",
        "name": "電気代",
        "budget": 12000
      },
      {
        "id": "household-8-5",
        "name": "食費",
        "budget": 50000
      },
      {
        "id": "household-8-6",
        "name": "日用品",
        "budget": 30000
      },
      {
        "id": "household-8-7",
        "name": "携帯代",
        "budget": 25000
      },
      {
        "id": "household-8-8",
        "name": "インターネット",
        "budget": 4536
      },
      {
        "id": "household-8-9",
        "name": "車の保険",
        "budget": 2450
      },
      {
        "id": "household-8-10",
        "name": "お小遣い（直）",
        "budget": 60000
      },
      {
        "id": "household-8-11",
        "name": "お小遣い（幸）",
        "budget": 60000
      },
      {
        "id": "household-8-12",
        "name": "コンタクト積立",
        "budget": 10000
      },
      {
        "id": "household-8-13",
        "name": "化粧品積立",
        "budget": 20000
      },
      {
        "id": "household-8-14",
        "name": "生命保険など",
        "budget": 10000
      },
      {
        "id": "household-8-15",
        "name": "ジム",
        "budget": 14000
      },
      {
        "id": "household-8-16",
        "name": "交通費",
        "budget": 8700
      },
      {
        "id": "household-8-17",
        "name": "投資積立",
        "budget": 3000
      },
      {
        "id": "household-8-18",
        "name": "家族貯金",
        "budget": 60000
      }
    ],
    "paymentItems": [
      {
        "id": "payment-8-1",
        "name": "カード代",
        "budget": 82686,
        "actual": 59134
      },
      {
        "id": "payment-8-2",
        "name": "家賃",
        "budget": 115756,
        "actual": 115756
      },
      {
        "id": "payment-8-3",
        "name": "積立投資",
        "budget": 3000,
        "actual": 3000
      },
      {
        "id": "payment-8-4",
        "name": "ジム",
        "budget": 12070,
        "actual": 12070
      },
      {
        "id": "payment-8-5",
        "name": "水道代",
        "budget": 10000,
        "actual": 0
      },
      {
        "id": "payment-8-6",
        "name": "ガス代",
        "budget": 10000,
        "actual": 7185
      },
      {
        "id": "payment-8-7",
        "name": "電気代",
        "budget": 12000,
        "actual": 4768
      },
      {
        "id": "payment-8-8",
        "name": "AI",
        "budget": 20000,
        "actual": 20000
      }
    ],
    "allocationItems": [
      {
        "id": "allocation-8-1",
        "name": "みずほ（青山）",
        "amount": 312857
      },
      {
        "id": "allocation-8-2",
        "name": "みずほ（王子）",
        "amount": 74204
      },
      {
        "id": "allocation-8-3",
        "name": "みずほ（川越）",
        "amount": 50000
      },
      {
        "id": "allocation-8-4",
        "name": "ソニー銀行",
        "amount": 60000
      },
      {
        "id": "allocation-8-5",
        "name": "ゆうちょ",
        "amount": 0
      },
      {
        "id": "allocation-8-6",
        "name": "手渡し",
        "amount": 170000
      },
      {
        "id": "allocation-8-7",
        "name": "インデックス投資",
        "amount": 0
      }
    ],
    "memo": "皮算用_2026.xlsxから移行",
    "updatedAt": "2026-07-27T00:00:00.000Z"
  },
  {
    "year": 2026,
    "month": 9,
    "grossIncome": 900000,
    "taxReservePercent": 30,
    "consumptionTaxPercent": 5,
    "householdItems": [
      {
        "id": "household-9-1",
        "name": "家賃＋駐車場",
        "budget": 115770
      },
      {
        "id": "household-9-2",
        "name": "水道代",
        "budget": 10000
      },
      {
        "id": "household-9-3",
        "name": "ガス代",
        "budget": 10000
      },
      {
        "id": "household-9-4",
        "name": "電気代",
        "budget": 12000
      },
      {
        "id": "household-9-5",
        "name": "食費",
        "budget": 50000
      },
      {
        "id": "household-9-6",
        "name": "日用品",
        "budget": 30000
      },
      {
        "id": "household-9-7",
        "name": "携帯代",
        "budget": 25000
      },
      {
        "id": "household-9-8",
        "name": "インターネット",
        "budget": 4536
      },
      {
        "id": "household-9-9",
        "name": "車の保険",
        "budget": 2450
      },
      {
        "id": "household-9-10",
        "name": "お小遣い（直）",
        "budget": 60000
      },
      {
        "id": "household-9-11",
        "name": "お小遣い（幸）",
        "budget": 60000
      },
      {
        "id": "household-9-12",
        "name": "コンタクト積立",
        "budget": 10000
      },
      {
        "id": "household-9-13",
        "name": "化粧品積立",
        "budget": 20000
      },
      {
        "id": "household-9-14",
        "name": "生命保険など",
        "budget": 10000
      },
      {
        "id": "household-9-15",
        "name": "ジム",
        "budget": 14000
      },
      {
        "id": "household-9-16",
        "name": "交通費",
        "budget": 8700
      },
      {
        "id": "household-9-17",
        "name": "投資積立",
        "budget": 3000
      },
      {
        "id": "household-9-18",
        "name": "家族貯金",
        "budget": 60000
      }
    ],
    "paymentItems": [
      {
        "id": "payment-9-1",
        "name": "カード代",
        "budget": 82686,
        "actual": 59134
      },
      {
        "id": "payment-9-2",
        "name": "家賃",
        "budget": 115756,
        "actual": 115756
      },
      {
        "id": "payment-9-3",
        "name": "積立投資",
        "budget": 3000,
        "actual": 3000
      },
      {
        "id": "payment-9-4",
        "name": "ジム",
        "budget": 12070,
        "actual": 12070
      },
      {
        "id": "payment-9-5",
        "name": "水道代",
        "budget": 10000,
        "actual": 0
      },
      {
        "id": "payment-9-6",
        "name": "ガス代",
        "budget": 10000,
        "actual": 7185
      },
      {
        "id": "payment-9-7",
        "name": "電気代",
        "budget": 12000,
        "actual": 4768
      },
      {
        "id": "payment-9-8",
        "name": "AI",
        "budget": 20000,
        "actual": 20000
      }
    ],
    "allocationItems": [
      {
        "id": "allocation-9-1",
        "name": "みずほ（青山）",
        "amount": 312857
      },
      {
        "id": "allocation-9-2",
        "name": "みずほ（王子）",
        "amount": 74204
      },
      {
        "id": "allocation-9-3",
        "name": "みずほ（川越）",
        "amount": 50000
      },
      {
        "id": "allocation-9-4",
        "name": "ソニー銀行",
        "amount": 60000
      },
      {
        "id": "allocation-9-5",
        "name": "ゆうちょ",
        "amount": 0
      },
      {
        "id": "allocation-9-6",
        "name": "手渡し",
        "amount": 170000
      },
      {
        "id": "allocation-9-7",
        "name": "インデックス投資",
        "amount": 0
      }
    ],
    "memo": "皮算用_2026.xlsxから移行",
    "updatedAt": "2026-07-27T00:00:00.000Z"
  },
  {
    "year": 2026,
    "month": 10,
    "grossIncome": 900000,
    "taxReservePercent": 30,
    "consumptionTaxPercent": 5,
    "householdItems": [
      {
        "id": "household-10-1",
        "name": "家賃＋駐車場",
        "budget": 115770
      },
      {
        "id": "household-10-2",
        "name": "水道代",
        "budget": 10000
      },
      {
        "id": "household-10-3",
        "name": "ガス代",
        "budget": 10000
      },
      {
        "id": "household-10-4",
        "name": "電気代",
        "budget": 12000
      },
      {
        "id": "household-10-5",
        "name": "食費",
        "budget": 50000
      },
      {
        "id": "household-10-6",
        "name": "日用品",
        "budget": 30000
      },
      {
        "id": "household-10-7",
        "name": "携帯代",
        "budget": 25000
      },
      {
        "id": "household-10-8",
        "name": "インターネット",
        "budget": 4536
      },
      {
        "id": "household-10-9",
        "name": "車の保険",
        "budget": 2450
      },
      {
        "id": "household-10-10",
        "name": "お小遣い（直）",
        "budget": 60000
      },
      {
        "id": "household-10-11",
        "name": "お小遣い（幸）",
        "budget": 60000
      },
      {
        "id": "household-10-12",
        "name": "コンタクト積立",
        "budget": 10000
      },
      {
        "id": "household-10-13",
        "name": "化粧品積立",
        "budget": 20000
      },
      {
        "id": "household-10-14",
        "name": "生命保険など",
        "budget": 10000
      },
      {
        "id": "household-10-15",
        "name": "ジム",
        "budget": 14000
      },
      {
        "id": "household-10-16",
        "name": "交通費",
        "budget": 8700
      },
      {
        "id": "household-10-17",
        "name": "投資積立",
        "budget": 3000
      },
      {
        "id": "household-10-18",
        "name": "家族貯金",
        "budget": 60000
      }
    ],
    "paymentItems": [
      {
        "id": "payment-10-1",
        "name": "カード代",
        "budget": 82686,
        "actual": 59134
      },
      {
        "id": "payment-10-2",
        "name": "家賃",
        "budget": 115756,
        "actual": 115756
      },
      {
        "id": "payment-10-3",
        "name": "積立投資",
        "budget": 3000,
        "actual": 3000
      },
      {
        "id": "payment-10-4",
        "name": "ジム",
        "budget": 12070,
        "actual": 12070
      },
      {
        "id": "payment-10-5",
        "name": "水道代",
        "budget": 10000,
        "actual": 0
      },
      {
        "id": "payment-10-6",
        "name": "ガス代",
        "budget": 10000,
        "actual": 7185
      },
      {
        "id": "payment-10-7",
        "name": "電気代",
        "budget": 12000,
        "actual": 4768
      },
      {
        "id": "payment-10-8",
        "name": "AI",
        "budget": 20000,
        "actual": 20000
      }
    ],
    "allocationItems": [
      {
        "id": "allocation-10-1",
        "name": "みずほ（青山）",
        "amount": 312857
      },
      {
        "id": "allocation-10-2",
        "name": "みずほ（王子）",
        "amount": 74204
      },
      {
        "id": "allocation-10-3",
        "name": "みずほ（川越）",
        "amount": 50000
      },
      {
        "id": "allocation-10-4",
        "name": "ソニー銀行",
        "amount": 60000
      },
      {
        "id": "allocation-10-5",
        "name": "ゆうちょ",
        "amount": 0
      },
      {
        "id": "allocation-10-6",
        "name": "手渡し",
        "amount": 170000
      },
      {
        "id": "allocation-10-7",
        "name": "インデックス投資",
        "amount": 0
      }
    ],
    "memo": "皮算用_2026.xlsxから移行",
    "updatedAt": "2026-07-27T00:00:00.000Z"
  },
  {
    "year": 2026,
    "month": 11,
    "grossIncome": 900000,
    "taxReservePercent": 30,
    "consumptionTaxPercent": 5,
    "householdItems": [
      {
        "id": "household-11-1",
        "name": "家賃＋駐車場",
        "budget": 115770
      },
      {
        "id": "household-11-2",
        "name": "水道代",
        "budget": 10000
      },
      {
        "id": "household-11-3",
        "name": "ガス代",
        "budget": 10000
      },
      {
        "id": "household-11-4",
        "name": "電気代",
        "budget": 12000
      },
      {
        "id": "household-11-5",
        "name": "食費",
        "budget": 50000
      },
      {
        "id": "household-11-6",
        "name": "日用品",
        "budget": 30000
      },
      {
        "id": "household-11-7",
        "name": "携帯代",
        "budget": 25000
      },
      {
        "id": "household-11-8",
        "name": "インターネット",
        "budget": 4536
      },
      {
        "id": "household-11-9",
        "name": "車の保険",
        "budget": 2450
      },
      {
        "id": "household-11-10",
        "name": "お小遣い（直）",
        "budget": 60000
      },
      {
        "id": "household-11-11",
        "name": "お小遣い（幸）",
        "budget": 60000
      },
      {
        "id": "household-11-12",
        "name": "コンタクト積立",
        "budget": 10000
      },
      {
        "id": "household-11-13",
        "name": "化粧品積立",
        "budget": 20000
      },
      {
        "id": "household-11-14",
        "name": "生命保険など",
        "budget": 10000
      },
      {
        "id": "household-11-15",
        "name": "ジム",
        "budget": 14000
      },
      {
        "id": "household-11-16",
        "name": "交通費",
        "budget": 8700
      },
      {
        "id": "household-11-17",
        "name": "投資積立",
        "budget": 3000
      },
      {
        "id": "household-11-18",
        "name": "家族貯金",
        "budget": 60000
      }
    ],
    "paymentItems": [
      {
        "id": "payment-11-1",
        "name": "カード代",
        "budget": 82686,
        "actual": 59134
      },
      {
        "id": "payment-11-2",
        "name": "家賃",
        "budget": 115756,
        "actual": 115756
      },
      {
        "id": "payment-11-3",
        "name": "積立投資",
        "budget": 3000,
        "actual": 3000
      },
      {
        "id": "payment-11-4",
        "name": "ジム",
        "budget": 12070,
        "actual": 12070
      },
      {
        "id": "payment-11-5",
        "name": "水道代",
        "budget": 10000,
        "actual": 0
      },
      {
        "id": "payment-11-6",
        "name": "ガス代",
        "budget": 10000,
        "actual": 7185
      },
      {
        "id": "payment-11-7",
        "name": "電気代",
        "budget": 12000,
        "actual": 4768
      },
      {
        "id": "payment-11-8",
        "name": "AI",
        "budget": 20000,
        "actual": 20000
      }
    ],
    "allocationItems": [
      {
        "id": "allocation-11-1",
        "name": "みずほ（青山）",
        "amount": 312857
      },
      {
        "id": "allocation-11-2",
        "name": "みずほ（王子）",
        "amount": 74204
      },
      {
        "id": "allocation-11-3",
        "name": "みずほ（川越）",
        "amount": 50000
      },
      {
        "id": "allocation-11-4",
        "name": "ソニー銀行",
        "amount": 60000
      },
      {
        "id": "allocation-11-5",
        "name": "ゆうちょ",
        "amount": 0
      },
      {
        "id": "allocation-11-6",
        "name": "手渡し",
        "amount": 170000
      },
      {
        "id": "allocation-11-7",
        "name": "インデックス投資",
        "amount": 0
      }
    ],
    "memo": "皮算用_2026.xlsxから移行",
    "updatedAt": "2026-07-27T00:00:00.000Z"
  },
  {
    "year": 2026,
    "month": 12,
    "grossIncome": 900000,
    "taxReservePercent": 30,
    "consumptionTaxPercent": 5,
    "householdItems": [
      {
        "id": "household-12-1",
        "name": "家賃＋駐車場",
        "budget": 115770
      },
      {
        "id": "household-12-2",
        "name": "水道代",
        "budget": 10000
      },
      {
        "id": "household-12-3",
        "name": "ガス代",
        "budget": 10000
      },
      {
        "id": "household-12-4",
        "name": "電気代",
        "budget": 12000
      },
      {
        "id": "household-12-5",
        "name": "食費",
        "budget": 50000
      },
      {
        "id": "household-12-6",
        "name": "日用品",
        "budget": 30000
      },
      {
        "id": "household-12-7",
        "name": "携帯代",
        "budget": 25000
      },
      {
        "id": "household-12-8",
        "name": "インターネット",
        "budget": 4536
      },
      {
        "id": "household-12-9",
        "name": "車の保険",
        "budget": 2450
      },
      {
        "id": "household-12-10",
        "name": "お小遣い（直）",
        "budget": 60000
      },
      {
        "id": "household-12-11",
        "name": "お小遣い（幸）",
        "budget": 60000
      },
      {
        "id": "household-12-12",
        "name": "コンタクト積立",
        "budget": 10000
      },
      {
        "id": "household-12-13",
        "name": "化粧品積立",
        "budget": 20000
      },
      {
        "id": "household-12-14",
        "name": "生命保険など",
        "budget": 10000
      },
      {
        "id": "household-12-15",
        "name": "ジム",
        "budget": 14000
      },
      {
        "id": "household-12-16",
        "name": "交通費",
        "budget": 8700
      },
      {
        "id": "household-12-17",
        "name": "投資積立",
        "budget": 3000
      },
      {
        "id": "household-12-18",
        "name": "家族貯金",
        "budget": 60000
      }
    ],
    "paymentItems": [
      {
        "id": "payment-12-1",
        "name": "カード代",
        "budget": 82686,
        "actual": 58801
      },
      {
        "id": "payment-12-2",
        "name": "家賃",
        "budget": 115756,
        "actual": 115756
      },
      {
        "id": "payment-12-3",
        "name": "積立投資",
        "budget": 3000,
        "actual": 3000
      },
      {
        "id": "payment-12-4",
        "name": "ジム",
        "budget": 12070,
        "actual": 12070
      },
      {
        "id": "payment-12-5",
        "name": "水道代",
        "budget": 10000,
        "actual": 0
      },
      {
        "id": "payment-12-6",
        "name": "ガス代",
        "budget": 10000,
        "actual": 7185
      },
      {
        "id": "payment-12-7",
        "name": "電気代",
        "budget": 12000,
        "actual": 4768
      },
      {
        "id": "payment-12-8",
        "name": "AI",
        "budget": 20000,
        "actual": 20000
      }
    ],
    "allocationItems": [
      {
        "id": "allocation-12-1",
        "name": "みずほ（青山）",
        "amount": 312857
      },
      {
        "id": "allocation-12-2",
        "name": "みずほ（王子）",
        "amount": 73871
      },
      {
        "id": "allocation-12-3",
        "name": "みずほ（川越）",
        "amount": 50000
      },
      {
        "id": "allocation-12-4",
        "name": "ソニー銀行",
        "amount": 60000
      },
      {
        "id": "allocation-12-5",
        "name": "ゆうちょ",
        "amount": 0
      },
      {
        "id": "allocation-12-6",
        "name": "手渡し",
        "amount": 170000
      },
      {
        "id": "allocation-12-7",
        "name": "インデックス投資",
        "amount": 0
      }
    ],
    "memo": "皮算用_2026.xlsxから移行",
    "updatedAt": "2026-07-27T00:00:00.000Z"
  }
];

export const imported2026Template: MonthlyPlan[] =
  imported2026TemplateSource.map((plan) => {
    return synchronizeMonthlyPlan({
      ...plan,
      consumptionTaxPercent: STANDARD_CONSUMPTION_TAX_PERCENT,
      simplifiedTaxCategory: DEFAULT_SIMPLIFIED_TAX_CATEGORY,
      householdItems: plan.householdItems.map(({ id, name, budget }) => ({
        id,
        name,
        budget,
      })),
      paymentItems: plan.paymentItems.map(({ id, name, actual }) => ({
        id,
        name,
        actual,
      })),
      allocationItems: mergeMizuhoOjiAllocations(plan.allocationItems),
    });
  });
