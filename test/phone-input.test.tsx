import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { PhoneInput, COUNTRIES } from "@/registry/components";

describe("PhoneInput", () => {
  it("defaults to the US dial code", () => {
    render(<PhoneInput />);
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("honours defaultCountry", () => {
    render(<PhoneInput defaultCountry="IN" />);
    expect(screen.getByText("+91")).toBeInTheDocument();
  });

  it("reports the number and the selected country on typing", async () => {
    const onValueChange = vi.fn();
    render(<PhoneInput onValueChange={onValueChange} />);

    await userEvent.type(screen.getByRole("textbox"), "5");

    expect(onValueChange).toHaveBeenCalledWith("5", expect.objectContaining({ code: "US" }));
  });

  it("follows an externally changed value prop (controlled mode)", async () => {
    function Harness() {
      const [value, setValue] = React.useState("111");
      return (
        <>
          <button type="button" onClick={() => setValue("222")}>
            set
          </button>
          <PhoneInput value={value} />
        </>
      );
    }
    render(<Harness />);
    expect(screen.getByRole("textbox")).toHaveValue("111");

    await userEvent.click(screen.getByRole("button", { name: "set" }));
    expect(screen.getByRole("textbox")).toHaveValue("222");
  });

  it("forwards a ref to the underlying input and accepts a name", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<PhoneInput ref={ref} name="phone" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(screen.getByRole("textbox")).toHaveAttribute("name", "phone");
  });

  it("exposes a searchable country listbox", async () => {
    render(<PhoneInput />);
    await userEvent.click(screen.getByRole("button", { name: "Select country" }));

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/search/i), "Germ");
    expect(screen.getByRole("option", { name: /Germany/ })).toBeInTheDocument();
  });

  it("keeps the forwarded ref on the phone input while the country list is open", async () => {
    // The search box used to share `inputRef`, so opening the list silently
    // repointed the forwarded ref at the wrong element.
    const ref = React.createRef<HTMLInputElement>();
    render(<PhoneInput ref={ref} />);
    expect(ref.current?.type).toBe("tel");

    await userEvent.click(screen.getByRole("button", { name: "Select country" }));
    expect(ref.current?.type).toBe("tel");
  });

  it("returns focus to the phone input after a country is picked", async () => {
    render(<PhoneInput />);
    await userEvent.click(screen.getByRole("button", { name: "Select country" }));
    await userEvent.click(screen.getByRole("option", { name: /India/ }));

    expect((document.activeElement as HTMLInputElement | null)?.type).toBe("tel");
  });

  it("focuses the search box when the country list opens", async () => {
    render(<PhoneInput />);
    await userEvent.click(screen.getByRole("button", { name: "Select country" }));

    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Search countries" }));
  });

  it("exports a COUNTRIES table with well-formed entries", () => {
    expect(COUNTRIES.length).toBeGreaterThan(0);

    for (const country of COUNTRIES) {
      expect(country.code).toMatch(/^[A-Z]{2}$/);
      expect(country.dialCode).toMatch(/^\+\d{1,4}$/);
      expect(country.name).not.toBe("");
      expect(country.flag).not.toBe("");
    }

    // Duplicate codes would make the country list ambiguous to select from.
    expect(new Set(COUNTRIES.map((c) => c.code)).size).toBe(COUNTRIES.length);
  });
});
