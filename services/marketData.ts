import { AssetData } from "../types";

export async function fetchSilverData(): Promise<AssetData> {
    const url = "http://localhost:3002/metal-json/history/XAG,EUR";

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);

    const rows = await resp.json();

    const chartData = rows.map((row: any) => ({
        date: new Date(row.time).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: row.value
    }));

    const first = rows[0].value;
    const last  = rows[rows.length - 1].value;
    const pct   = ((last - first) / first) * 100;

    return {
        id: "silver",
        name: "Silver (XAG/USD)",
        currentValue: String(last),
        percentageChange: Number(pct.toFixed(2)),
        currency: "$",
        data: chartData,
        performance: [
            { period: "Since Start", value: pct, formattedValue: pct.toFixed(2) + "%" }
        ],
        sources: ["Local metal-json API"]
    };
}