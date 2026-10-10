"""Render Facebook marketing images for the AIO page."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT_DIR = Path(__file__).resolve().parents[2]
OUTPUT_DIR = Path(__file__).resolve().parent / "output"
LOGO_PATH = ROOT_DIR / "public" / "images" / "aio-logo.png"
FONT_REGULAR = Path("C:/Windows/Fonts/tahoma.ttf")
FONT_BOLD = Path("C:/Windows/Fonts/tahomabd.ttf")


@dataclass(frozen=True)
class Asset:
    """Marketing asset rendering configuration."""

    filename: str
    size: tuple[int, int]
    kind: str


def font(size: int, *, bold: bool = True) -> ImageFont.FreeTypeFont:
    """Load a Tahoma font with the requested size."""

    return ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), size)


def rtl(value: str) -> str:
    """Shape Arabic text for Pillow rendering."""

    return get_display(arabic_reshaper.reshape(value))


def text_right(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    lines: Sequence[str],
    size: int,
    fill: str,
    *,
    bold: bool = True,
    gap: float = 1.28,
) -> None:
    """Draw right-aligned Arabic text."""

    x, y = xy
    selected_font = font(size, bold=bold)
    for index, line in enumerate(lines):
        draw.text(
            (x, y + int(index * size * gap)),
            rtl(line),
            font=selected_font,
            fill=fill,
            anchor="ra",
        )


def text_center(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    value: str,
    size: int,
    fill: str,
    *,
    bold: bool = True,
    arabic: bool = True,
) -> None:
    """Draw centered text."""

    draw.text(
        xy,
        rtl(value) if arabic else value,
        font=font(size, bold=bold),
        fill=fill,
        anchor="mm",
    )


def gradient_background(size: tuple[int, int]) -> Image.Image:
    """Create a soft AIO branded background."""

    width, height = size
    image = Image.new("RGB", size, "#ffffff")
    pixels = image.load()
    start = (255, 255, 255)
    end = (237, 247, 255)
    for y in range(height):
        for x in range(width):
            ratio = (x / width * 0.55) + (y / height * 0.45)
            pixels[x, y] = tuple(
                int(start[channel] * (1 - ratio) + end[channel] * ratio)
                for channel in range(3)
            )

    overlay = Image.new("RGBA", size, (255, 255, 255, 0))
    odraw = ImageDraw.Draw(overlay)
    odraw.ellipse(
        (-int(width * 0.08), -int(height * 0.05), int(width * 0.35), int(height * 0.38)),
        fill=(6, 182, 212, 34),
    )
    odraw.ellipse(
        (int(width * 0.68), -int(height * 0.08), int(width * 1.08), int(height * 0.32)),
        fill=(79, 70, 229, 38),
    )
    for x in range(0, width, 48):
        odraw.line((x, 0, x, height), fill=(148, 163, 184, 34), width=1)
    for y in range(0, height, 48):
        odraw.line((0, y, width, y), fill=(148, 163, 184, 34), width=1)
    return Image.alpha_composite(image.convert("RGBA"), overlay)


def shadow_card(
    image: Image.Image,
    box: tuple[int, int, int, int],
    radius: int,
    fill: str,
    outline: str = "#dbe3ef",
) -> None:
    """Draw a rounded card with a soft shadow."""

    x1, y1, x2, y2 = box
    shadow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle((x1, y1 + 18, x2, y2 + 18), radius, fill=(15, 23, 42, 34))
    shadow = shadow.filter(ImageFilter.GaussianBlur(20))
    image.alpha_composite(shadow)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(box, radius, fill=fill, outline=outline, width=2)


def draw_brand(
    draw: ImageDraw.ImageDraw,
    image: Image.Image,
    x: int,
    y: int,
    *,
    compact: bool = False,
) -> None:
    """Draw the AIO brand lockup."""

    logo = Image.open(LOGO_PATH).convert("RGBA").resize((78, 78), Image.Resampling.LANCZOS)
    image.alpha_composite(logo, (x - 78, y - 56))
    if not compact:
        draw.text((x - 94, y - 2), "All In One (AIO)", font=font(38), fill="#1e1b8f", anchor="rm")


def draw_pill(draw: ImageDraw.ImageDraw, right: int, y: int, label: str, width: int) -> None:
    """Draw a rounded Arabic eyebrow label."""

    draw.rounded_rectangle(
        (right - width, y - 44, right, y + 24),
        34,
        fill="#ffffff",
        outline="#dbe3ef",
        width=2,
    )
    draw.text((right - 28, y), rtl(label), font=font(25), fill="#1e1b8f", anchor="ra")


def draw_cta(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], label: str) -> None:
    """Draw a dark call-to-action button."""

    draw.rounded_rectangle(box, 18, fill="#0f172a")
    text_center(
        draw,
        ((box[0] + box[2]) // 2, (box[1] + box[3]) // 2),
        label,
        24,
        "#ffffff",
    )


def draw_feature(
    image: Image.Image,
    box: tuple[int, int, int, int],
    color: str,
    number: str,
    title: str,
    body: str,
) -> None:
    """Draw a feature card."""

    shadow_card(image, box, 24, "#ffffff")
    draw = ImageDraw.Draw(image)
    x1, y1, x2, _ = box
    draw.rounded_rectangle((x2 - 88, y1 + 31, x2 - 24, y1 + 95), 18, fill=color)
    text_center(draw, (x2 - 56, y1 + 64), number, 30, "#ffffff", arabic=False)
    text_right(draw, (x2 - 112, y1 + 46), [title], 27, "#0f172a")
    text_right(draw, (x2 - 112, y1 + 82), [body], 19, "#64748b")


def render_cover() -> Image.Image:
    """Render the Facebook cover asset."""

    image = gradient_background((1640, 624))
    draw = ImageDraw.Draw(image)
    draw_brand(draw, image, 1530, 104, compact=True)
    draw_pill(draw, 1500, 190, "بديل آمن لفوضى واتساب وجروبات الشغل", 575)
    text_right(draw, (1500, 282), ["بيانات شركتك محمية", "ومنظمة في مكان واحد"], 70, "#0f172a", gap=1.14)
    text_right(
        draw,
        (1500, 452),
        ["رومات خاصة، ملفات محمية، صلاحيات واضحة،", "وتتبع كامل لكل مشاهدة داخل شركتك أو أكاديميتك."],
        30,
        "#334155",
    )
    draw.rounded_rectangle((1040, 538, 1360, 604), 18, fill="#4f46e5")
    text_center(draw, (1200, 570), "ابدأ أول شهر مجانا", 30, "#ffffff")

    shadow_card(image, (78, 104, 653, 524), 34, "#ffffff")
    draw = ImageDraw.Draw(image)
    for index, color in enumerate(("#ef4444", "#f59e0b", "#10b981")):
        draw.ellipse((132 + index * 28, 143, 150 + index * 28, 161), fill=color)
    draw.rounded_rectangle((490, 134, 594, 168), 17, fill="#dcfce7")
    text_center(draw, (542, 151), "Live", 17, "#047857", arabic=False)

    stats = [("142", "ملف محمي", "#eef2ff", "#4f46e5"), ("48", "عضو نشط", "#ecfeff", "#06b6d4"), ("5", "رومات", "#f0fdf4", "#10b981")]
    for index, (num, label, bg_color, fg) in enumerate(stats):
        x = 110 + index * 178
        draw.rounded_rectangle((x, 196, x + 154, 282), 20, fill=bg_color)
        text_center(draw, (x + 77, 236), num, 38, fg, arabic=False)
        text_center(draw, (x + 77, 264), label, 17, "#64748b")

    rooms = [
        ("قسم المبيعات", "Watermark + صلاحيات عرض", "#4f46e5"),
        ("فريق التدريب", "كورس جديد + حضور مباشر", "#06b6d4"),
        ("ملفات الإدارة", "تتبع مشاهدة وتحديثات", "#10b981"),
    ]
    for index, (title, body, color) in enumerate(rooms):
        y = 310 + index * 64
        draw.rounded_rectangle((110, y, 620, y + 54), 18, fill="#ffffff", outline="#dbe3ef", width=2)
        draw.rounded_rectangle((552, y + 9, 588, y + 45), 12, fill=color)
        text_right(draw, (534, y + 20), [title], 19, "#0f172a")
        text_right(draw, (534, y + 42), [body], 14, "#64748b")
    return image


def render_launch() -> Image.Image:
    """Render the launch post asset."""

    image = gradient_background((1080, 1080))
    draw = ImageDraw.Draw(image)
    draw_brand(draw, image, 1008, 116)
    draw_pill(draw, 1008, 210, "للشركات والأكاديميات", 365)
    text_right(draw, (1008, 330), ["كل شغلك في", "منصة واحدة"], 82, "#0f172a", gap=1.14)
    text_right(
        draw,
        (1008, 552),
        ["ارفع ملفاتك، نظم فريقك، واعمل رومات آمنة", "بدل الجروبات المتشتتة."],
        31,
        "#334155",
    )
    draw_feature(image, (74, 640, 512, 766), "#4f46e5", "1", "ملفات محمية", "Watermark وتتبع مشاهدة")
    draw_feature(image, (568, 640, 1006, 766), "#06b6d4", "2", "رومات خاصة", "لكل فريق أو كورس")
    draw_feature(image, (74, 790, 512, 916), "#10b981", "3", "صلاحيات واضحة", "كل عضو يشوف اللي يخصه")
    draw_feature(image, (568, 790, 1006, 916), "#f59e0b", "4", "اشتراكات وتنبيهات", "متابعة أسهل للإدارة")
    draw.text((72, 1008), "AIO Secure Workspace", font=font(27), fill="#1e1b8f", anchor="la")
    draw_cta(draw, (762, 962, 1008, 1024), "اطلب ديمو الآن")
    return image


def render_security() -> Image.Image:
    """Render the security problem-solution post."""

    image = gradient_background((1080, 1080))
    draw = ImageDraw.Draw(image)
    draw_brand(draw, image, 1008, 116)
    draw_pill(draw, 1008, 210, "حماية محتوى شركتك", 370)
    text_right(draw, (1008, 326), ["واتساب مش مكان", "لملفاتك المهمة"], 78, "#0f172a", gap=1.14)
    shadow_card(image, (74, 540, 520, 870), 28, "#fff7f7", "#fecaca")
    shadow_card(image, (560, 540, 1006, 870), 28, "#f0fdf4", "#bbf7d0")
    draw = ImageDraw.Draw(image)
    text_right(draw, (472, 602), ["المشكلة"], 34, "#ef4444")
    text_right(
        draw,
        (472, 670),
        ["ملفات بتتبعث وتتسرب بسهولة", "مفيش تحكم في مين يشوف إيه", "مفيش تقرير مشاهدة أو متابعة"],
        27,
        "#26364d",
        gap=1.72,
    )
    text_right(draw, (958, 602), ["الحل"], 34, "#047857")
    text_right(
        draw,
        (958, 670),
        ["Watermark باسم كل مستخدم", "صلاحيات لكل روم وفريق", "Dashboard لمتابعة النشاط"],
        27,
        "#26364d",
        gap=1.72,
    )
    draw.text((72, 1008), rtl("بديل آمن لجروبات الشغل"), font=font(27), fill="#1e1b8f", anchor="la")
    draw_cta(draw, (762, 962, 1008, 1024), "ابدأ مجانا")
    return image


def render_academies() -> Image.Image:
    """Render the academies marketplace portrait post."""

    image = gradient_background((1080, 1350))
    draw = ImageDraw.Draw(image)
    draw_brand(draw, image, 1008, 116)
    draw_pill(draw, 1008, 220, "للأكاديميات ومراكز التدريب", 480)
    text_right(draw, (1008, 340), ["بيع كورساتك", "ونظم طلابك", "من مكان واحد"], 76, "#0f172a", gap=1.14)
    text_right(
        draw,
        (1008, 640),
        ["صفحات كورسات، حجز، دفع، انضمام للرومات،", "ومحتوى محمي للطلاب بعد التأكيد."],
        31,
        "#334155",
    )
    shadow_card(image, (72, 760, 512, 1152), 30, "#ffffff")
    shadow_card(image, (560, 760, 1008, 1152), 30, "#ffffff")
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((104, 792, 480, 966), 26, fill="#4f46e5")
    text_center(draw, (292, 882), "AIO", 80, "#ffffff", arabic=False)
    text_right(draw, (466, 1018), ["كورس احترافي", "جاهز للحجز"], 30, "#0f172a", gap=1.2)
    text_right(draw, (466, 1092), ["تفاصيل واضحة، مدربين،", "مواعيد، وسعة لكل دفعة."], 22, "#64748b")
    for index, line in enumerate(("انشر الكورس على المنصة", "استقبل الحجز والدفع بسهولة", "افتح روم آمن للطلاب", "تابع الحضور والمحتوى")):
        y = 834 + index * 74
        draw.rounded_rectangle((916, y - 38, 974, y + 20), 18, fill="#4f46e5")
        text_center(draw, (945, y - 8), str(index + 1), 28, "#ffffff", arabic=False)
        text_right(draw, (892, y - 8), [line], 26, "#0f172a")
    draw.text((72, 1278), "AIO Learning Marketplace", font=font(27), fill="#1e1b8f", anchor="la")
    draw_cta(draw, (762, 1232, 1008, 1294), "اطلب ديمو")
    return image


def assets() -> Iterable[tuple[str, Image.Image]]:
    """Yield all generated marketing images."""

    yield "aio-facebook-cover.png", render_cover()
    yield "aio-launch-post.png", render_launch()
    yield "aio-security-post.png", render_security()
    yield "aio-academies-post.png", render_academies()


def main() -> None:
    """Render all Facebook assets."""

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for filename, image in assets():
        image.convert("RGB").save(OUTPUT_DIR / filename, quality=95)
    print(f"Rendered Facebook assets to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
