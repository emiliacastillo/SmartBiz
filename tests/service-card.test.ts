// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ServiceCard } from "@/components/service-card";
import type { BusinessLinkRecord } from "@/lib/data-store";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("cycles images, opens an accessible modal, and reports the selected image and action", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  const link = { id: "service", label: "Masaje", url: "", description: "Relajación", images: [
    { id: "one", url: "https://example.com/one.jpg", description: "Sala" },
    { id: "two", url: "https://example.com/two.jpg", description: "Tratamiento", actions: [
      { id: "contact", type: "EMAIL", label: "Consultar esta imagen", url: "mailto:contact@example.test" },
    ] },
  ], actions: [{ id: "shop", type: "STORE", label: "Comprar", url: "https://example.com/shop" }] } as BusinessLinkRecord;
  render(createElement(ServiceCard, { link, tagCode: "CODE", source: "qr" }));
  expect(screen.queryByRole("link", { name: /Consultar esta imagen/ })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Imagen siguiente de Masaje" }));
  expect(screen.getByRole("img").getAttribute("alt")).toBe("Tratamiento");
  fireEvent.click(screen.getByRole("button", { name: "Ampliar imagen de Masaje" }));
  expect(screen.getByRole("dialog").getAttribute("open")).toBe("");
  const contact = screen.getAllByRole("link", { name: /Consultar esta imagen/ }).at(-1)!;
  expect(contact.getAttribute("href")).toBe("mailto:contact@example.test");
  fireEvent.click(contact);
  fireEvent.click(screen.getByRole("button", { name: "Cerrar imagen" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("link", { name: /Comprar/ }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
  const events = fetchMock.mock.calls.map(([, options]) => JSON.parse(options.body));
  expect(events.map(({ eventType, targetId }) => [eventType, targetId])).toEqual([
    ["IMAGE_VIEW", "two"], ["IMAGE_EXPAND", "two"], ["LINK_CLICK", "contact"], ["LINK_CLICK", "shop"],
  ]);
  expect(events[2].imageId).toBe("two");
  expect(events.every((event) => event.tagCode === "CODE" && event.source === "qr")).toBe(true);
});
