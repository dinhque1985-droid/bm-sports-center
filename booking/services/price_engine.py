from booking.models import PriceRule


# ================= MONTHLY =================
def calculate_monthly_price(court_type, start, end, date):

    from booking.models import MonthlyRule

    rule = MonthlyRule.objects.filter(
        court_type=court_type,
        start__lte=start,
        end__gte=end,
        is_active=True
    ).first()

    if not rule:
        print("⚠️ NO MONTHLY RULE FOUND")
        return 0

    base_price = calculate_hourly_price(
        court_type=court_type,
        start=start,
        end=end,
        date=date
    )

    final_price = int(base_price * rule.pricing_factor)

    print("🧪 MONTHLY PRICE:", {
        "base": base_price,
        "factor": rule.pricing_factor,
        "final": final_price
    })

    return final_price


# ================= HOURLY CORE =================
def calculate_hourly_price(court_type, start, end, date):

    if start >= end:
        raise Exception("Thời gian không hợp lệ")

    rules = list(
        PriceRule.objects.filter(
            court_type=court_type,
            is_active=True
        )
    )

    # 🔥 FIX 1: tránh crash rỗng
    if not rules:
        print("❌ NO PRICE RULE FOUND")
        return 0

    rules.sort(key=lambda r: r.start_minute)

    total = 0
    current = start

    while current < end:

        matched = None

        for r in rules:
            if r.start_minute <= current < r.end_minute:
                matched = r
                break

        # 🔥 FIX 2: KHÔNG crash → fallback
        if not matched:
            print(f"⚠️ NO RULE MATCH at minute {current}")
            current += 1
            continue

        segment_end = min(end, matched.end_minute)
        duration = segment_end - current

        total += (duration / 60) * matched.price_per_hour

        current = segment_end

    return int(total)


# ================= MAIN ENTRY =================
def calculate_price(court_type, start, end, date, rule_type="normal"):

    if rule_type == "monthly":
        return calculate_monthly_price(
            court_type=court_type,
            start=start,
            end=end,
            date=date
        )

    return calculate_hourly_price(
        court_type=court_type,
        start=start,
        end=end,
        date=date
    )