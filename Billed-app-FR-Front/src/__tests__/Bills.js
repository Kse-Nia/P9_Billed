/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

// Containers Bills
const setupBillsContainer = (store) => {
  document.body.innerHTML = BillsUI({ data: bills });
  const onNavigate = jest.fn();
  const container = new Bills({
    document,
    onNavigate,
    store,
    localStorage: window.localStorage,
  });
  return { container, onNavigate };
};

// Store bills
const createStoreWithBills = (billsList) => ({
  bills: () => ({ list: () => Promise.resolve(billsList) }),
});

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        }),
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");

      // Check if the icon is highlighted
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i,
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  describe("When I click on the new bill button", () => {
    test("Then handleClickNewBill should be called and I should be sent to the NewBill page", () => {
      const { onNavigate } = setupBillsContainer(null);

      fireEvent.click(screen.getByTestId("btn-new-bill"));

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });
  });

  describe("When I click on the eye icon of a bill", () => {
    // jsdom ne charge pas le plugin modal de Bootstrap : on le simule.
    beforeEach(() => {
      $.fn.modal = jest.fn();
    });

    afterEach(() => {
      delete $.fn.modal;
    });

    test("Then a modal should open showing the bill's proof", () => {
      setupBillsContainer(null);
      const icon = screen.getAllByTestId("icon-eye")[0];
      const billUrl = icon.getAttribute("data-bill-url");

      fireEvent.click(icon);

      expect($.fn.modal).toHaveBeenCalledWith("show");
      const modalBody = document.querySelector("#modaleFile .modal-body");
      const img = modalBody.querySelector("img");
      expect(img).toBeTruthy();
      expect(img.getAttribute("src")).toBe(billUrl);
    });
  });

  describe("When I call getBills", () => {
    test("Then it should fetch bills from the store, format their date and status, and sort them from latest to earliest", async () => {
      const store = createStoreWithBills([
        { id: "1", date: "2021-05-12", status: "pending" },
        { id: "2", date: "2022-08-01", status: "accepted" },
        { id: "3", date: "2020-01-30", status: "refused" },
      ]);
      const { container } = setupBillsContainer(store);

      const result = await container.getBills();

      expect(result.map((b) => b.id)).toEqual(["2", "1", "3"]);
      expect(result[0].status).toBe("Accepté");
      expect(result[1].status).toBe("En attente");
      expect(result[2].status).toBe("Refused");
    });

    test("Then it should return undefined when there is no store", () => {
      const { container } = setupBillsContainer(null);

      expect(container.getBills()).toBeUndefined();
    });

    test("Then a corrupted date should be caught, logged and kept unformatted", async () => {
      const consoleLog = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const store = createStoreWithBills([
        { id: "1", date: "not-a-valid-date", status: "pending" },
      ]);
      const { container } = setupBillsContainer(store);

      const result = await container.getBills();

      expect(result[0].date).toBe("not-a-valid-date");
      expect(result[0].status).toBe("En attente");
      expect(consoleLog).toHaveBeenCalledWith(
        expect.any(Error),
        "for",
        expect.objectContaining({ id: "1" }),
      );
    });
  });
});
