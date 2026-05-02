from datetime import timedelta

from booking.services.price_engine import calculate_price


def calculate_block_price(
    court_type,
    start,
    end,
    date_from,
    date_to,
    factor=1.0,
    rule_type="normal"
):
    """
    Tính giá block (recurring)

    ✔ Loop từng ngày
    ✔ Gọi price_engine cho từng ngày
    ✔ Cộng dồn
    ✔ Nhân hệ số (pricing_factor)

    rule_type:
        - normal → dùng hourly
        - peak → vẫn hourly (rule nằm trong PriceRule)
        - monthly → dùng monthly engine
    """

    # ===== VALIDATE =====
    if start >= end:
        raise ValueError("Thời gian không hợp lệ")

    if date_from > date_to:
        raise ValueError("date_from must be <= date_to")

    total = 0
    current = date_from
    days = 0

    while current <= date_to:

        # ===== CHỌN ENGINE =====
        if rule_type == "monthly":
            day_price = calculate_price(
                court_type=court_type,
                start=start,
                end=end,
                date=current,
                rule_type="monthly"
            )
        else:
            # 🔥 normal + peak → dùng hourly
            day_price = calculate_price(
                court_type=court_type,
                start=start,
                end=end,
                date=current
            )

        total += day_price

        current += timedelta(days=1)
        days += 1

    # ===== APPLY FACTOR =====
    total = int(total * (factor or 1))

    # ===== DEBUG =====
    print("🧪 BLOCK PRICE DEBUG:", {
        "court_type": court_type,
        "days": days,
        "rule_type": rule_type,
        "factor": factor,
        "total": total
    })

    return total