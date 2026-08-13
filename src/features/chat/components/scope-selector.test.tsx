import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ScopeSelector } from "@/features/chat/components/scope-selector";

describe("ScopeSelector", () => {
  it("marks the current scope as checked", () => {
    render(<ScopeSelector scope="docs" onChange={vi.fn()} />);
    expect(screen.getByRole("radio", { name: /docs/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /code/i })).toHaveAttribute("aria-checked", "false");
  });

  it("calls onChange with 'code' when the Code option is clicked, never auto-switching on its own", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ScopeSelector scope="docs" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: /code/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("code");
  });

  it("does not call onChange when clicking the already-active scope", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ScopeSelector scope="docs" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: /docs/i }));

    expect(onChange).toHaveBeenCalledWith("docs");
  });
});
