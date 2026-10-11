import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { LanguageSwitcherPill } from "@/registry/components";

const locales = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية", rtl: true },
];

describe("LanguageSwitcherPill", () => {
  it("renders all locales", () => {
    render(<LanguageSwitcherPill locales={locales} />);

    expect(screen.getByRole("radio", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Français" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "العربية" })).toBeInTheDocument();
  });

  it("selects the first locale by default", () => {
    render(<LanguageSwitcherPill locales={locales} />);

    expect(screen.getByRole("radio", { name: "English" })).toHaveAttribute("aria-checked", "true");

    expect(screen.getByRole("radio", { name: "Français" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("honours defaultLocale", () => {
    render(<LanguageSwitcherPill locales={locales} defaultLocale="fr" />);

    expect(screen.getByRole("radio", { name: "Français" })).toHaveAttribute("aria-checked", "true");
  });

  it("falls back to the first locale when the selected locale is unknown", () => {
    render(<LanguageSwitcherPill locales={locales} defaultLocale="unknown" />);

    const english = screen.getByRole("radio", { name: "English" });
    const french = screen.getByRole("radio", { name: "Français" });
    const arabic = screen.getByRole("radio", { name: "العربية" });

    expect(english).toHaveAttribute("aria-checked", "true");
    expect(english).toHaveAttribute("tabindex", "0");

    expect(french).toHaveAttribute("aria-checked", "false");
    expect(french).toHaveAttribute("tabindex", "-1");

    expect(arabic).toHaveAttribute("aria-checked", "false");
    expect(arabic).toHaveAttribute("tabindex", "-1");
  });

  it("calls onLocaleChange when a locale is selected", async () => {
    const onLocaleChange = vi.fn();

    render(<LanguageSwitcherPill locales={locales} onLocaleChange={onLocaleChange} />);

    await userEvent.click(screen.getByRole("radio", { name: "Français" }));

    expect(onLocaleChange).toHaveBeenCalledTimes(1);
    expect(onLocaleChange).toHaveBeenCalledWith("fr");
  });

  it("supports controlled mode", async () => {
    function Harness() {
      const [locale, setLocale] = React.useState("en");

      return (
        <>
          <button type="button" onClick={() => setLocale("fr")}>
            set fr
          </button>

          <LanguageSwitcherPill locales={locales} locale={locale} />
        </>
      );
    }

    render(<Harness />);

    expect(screen.getByRole("radio", { name: "English" })).toHaveAttribute("aria-checked", "true");

    await userEvent.click(screen.getByRole("button", { name: "set fr" }));

    expect(screen.getByRole("radio", { name: "Français" })).toHaveAttribute("aria-checked", "true");
  });

  it("forwards a ref to the root element", () => {
    const ref = React.createRef<HTMLDivElement>();

    render(<LanguageSwitcherPill locales={locales} ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("passes unknown props through to the root element", () => {
    render(<LanguageSwitcherPill locales={locales} data-testid="language-switcher-pill" />);

    expect(screen.getByTestId("language-switcher-pill")).toBeInTheDocument();
  });

  it("supports keyboard navigation", async () => {
    const user = userEvent.setup();

    render(<LanguageSwitcherPill locales={locales} />);

    const english = screen.getByRole("radio", { name: "English" });
    const french = screen.getByRole("radio", { name: "Français" });

    english.focus();

    await user.keyboard("{ArrowRight}");

    expect(french).toHaveFocus();
    expect(french).toHaveAttribute("aria-checked", "true");
  });

  it("reverses arrow navigation in RTL", async () => {
    const user = userEvent.setup();

    render(<LanguageSwitcherPill locales={locales} dir="rtl" defaultLocale="ar" />);

    const arabic = screen.getByRole("radio", { name: "العربية" });
    const french = screen.getByRole("radio", { name: "Français" });

    arabic.focus();

    await user.keyboard("{ArrowRight}");

    expect(french).toHaveFocus();
    expect(french).toHaveAttribute("aria-checked", "true");
  });

  it("supports Home and End keyboard navigation", async () => {
    const user = userEvent.setup();

    render(<LanguageSwitcherPill locales={locales} />);

    const english = screen.getByRole("radio", { name: "English" });
    const arabic = screen.getByRole("radio", { name: "العربية" });

    english.focus();

    await user.keyboard("{End}");

    expect(arabic).toHaveFocus();
    expect(arabic).toHaveAttribute("aria-checked", "true");

    await user.keyboard("{Home}");

    expect(english).toHaveFocus();
    expect(english).toHaveAttribute("aria-checked", "true");
  });

  it("applies the dir prop to the root element", () => {
    const { container, rerender } = render(<LanguageSwitcherPill locales={locales} dir="rtl" />);

    expect(container.firstElementChild).toHaveAttribute("dir", "rtl");

    rerender(<LanguageSwitcherPill locales={locales} dir="ltr" />);
    expect(container.firstElementChild).toHaveAttribute("dir", "ltr");
  });

  it("sets per-button dir attribute for RTL locales", () => {
    render(<LanguageSwitcherPill locales={locales} />);

    expect(screen.getByRole("radio", { name: "English" })).toHaveAttribute("dir", "ltr");
    expect(screen.getByRole("radio", { name: "العربية" })).toHaveAttribute("dir", "rtl");
  });

  it("does not flip container direction or oscillate when navigating to an RTL locale", async () => {
    const user = userEvent.setup();
    const demoLocales = [
      { code: "en", label: "English" },
      { code: "fr", label: "Français" },
      { code: "de", label: "Deutsch" },
      { code: "ja", label: "日本語" },
      { code: "ar", label: "العربية", rtl: true },
    ];

    const { container } = render(<LanguageSwitcherPill locales={demoLocales} defaultLocale="ja" />);

    const ja = screen.getByRole("radio", { name: "日本語" });
    const ar = screen.getByRole("radio", { name: "العربية" });
    const en = screen.getByRole("radio", { name: "English" });

    ja.focus();

    // ArrowRight from ja selects ar
    await user.keyboard("{ArrowRight}");
    expect(ar).toHaveFocus();
    expect(ar).toHaveAttribute("aria-checked", "true");
    expect(container.firstElementChild).not.toHaveAttribute("dir", "rtl");

    // Next ArrowRight wraps to en instead of oscillating back to ja
    await user.keyboard("{ArrowRight}");
    expect(en).toHaveFocus();
    expect(en).toHaveAttribute("aria-checked", "true");
  });
});
