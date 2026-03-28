import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Toast } from "./toast";

describe("Toast", () => {
  it("renders message and action buttons", () => {
    render(
      <Toast
        message="Something changed."
        actions={[
          { label: "Reload", onClick: vi.fn(), primary: true },
          { label: "Dismiss", onClick: vi.fn() },
        ]}
      />,
    );

    expect(screen.getByText("Something changed.")).toBeDefined();
    expect(screen.getByText("Reload")).toBeDefined();
    expect(screen.getByText("Dismiss")).toBeDefined();
  });

  it("calls onClick when primary action is clicked", () => {
    const onReload = vi.fn();
    render(
      <Toast
        message="Changed."
        actions={[{ label: "Reload", onClick: onReload, primary: true }]}
      />,
    );

    fireEvent.click(screen.getByText("Reload"));
    expect(onReload).toHaveBeenCalledOnce();
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(
      <Toast message="Changed." actions={[]} onDismiss={onDismiss} />,
    );

    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("does not render dismiss button when onDismiss is not provided", () => {
    render(<Toast message="Changed." actions={[]} />);

    expect(screen.queryByLabelText("Dismiss")).toBeNull();
  });
});
