import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import DashboardUI from "../views/DashboardUI.js";
import Dashboard, { filteredBills, cards } from "../containers/Dashboard.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { bills } from "../fixtures/bills";
import router from "../app/Router";

jest.mock("../app/store", () => mockStore);

// --- Helpers -----------------

// Check admin LS
const connectAsAdmin = () => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  window.localStorage.setItem("user", JSON.stringify({ type: "Admin" }));
};

const setupDashboard = () => {
  connectAsAdmin();
  document.body.innerHTML = DashboardUI({ data: { bills } });
  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname });
  };
  return new Dashboard({
    document,
    onNavigate,
    store: null,
    bills,
    localStorage: window.localStorage,
  });
};

// Open the "pending" list, then open first bill
const openFirstPendingBill = () => {
  const dashboard = setupDashboard();
  userEvent.click(screen.getByTestId("arrow-icon1"));
  userEvent.click(screen.getByTestId("open-bill47qAXb6fIm2zOKkLzMro"));
  return dashboard;
};

// ----------- Tests -------------------------------------

describe("Given I am connected as an Admin", () => {
  describe("When I am on Dashboard page with bills loaded", () => {
    test("Then filteredBills should filter bills by status", () => {
      expect(filteredBills(bills, "pending")).toHaveLength(1);
      expect(filteredBills(bills, "accepted")).toHaveLength(1);
      expect(filteredBills(bills, "refused")).toHaveLength(2);
      expect(filteredBills(bills, "unknown")).toHaveLength(0);
      expect(filteredBills([], "pending")).toHaveLength(0);
    });

    test("Then no cards should be shown when there are no bills", () => {
      document.body.innerHTML = cards([]);
      expect(screen.queryByTestId("open-bill47qAXb6fIm2zOKkLzMro")).toBeNull();
    });
  });

  describe("When Dashboard is loading", () => {
    test("Then the Loading page should be rendered", () => {
      document.body.innerHTML = DashboardUI({ loading: true });
      expect(screen.getAllByText("Loading...")).toBeTruthy();
    });
  });

  describe("When the back-end sends an error", () => {
    test("Then the Error page should be rendered", () => {
      document.body.innerHTML = DashboardUI({ error: "some error message" });
      expect(screen.getAllByText("Erreur")).toBeTruthy();
    });
  });

  describe("When I click on the status arrows", () => {
    test("Then unfolding each arrow should show its bills", () => {
      setupDashboard();

      userEvent.click(screen.getByTestId("arrow-icon1"));
      expect(screen.getByTestId("open-bill47qAXb6fIm2zOKkLzMro")).toBeTruthy();

      userEvent.click(screen.getByTestId("arrow-icon2"));
      expect(screen.getByTestId("open-billUIUZtnPQvnbFnB0ozvJh")).toBeTruthy();

      userEvent.click(screen.getByTestId("arrow-icon3"));
      expect(screen.getByTestId("open-billBeKy5Mo4jkmdfPGYpTxZ")).toBeTruthy();
    });

    test("Then a second click on the same arrow should fold the list back", () => {
      setupDashboard();
      const icon1 = screen.getByTestId("arrow-icon1");

      userEvent.click(icon1);
      expect(screen.getByTestId("open-bill47qAXb6fIm2zOKkLzMro")).toBeTruthy();

      userEvent.click(icon1);
      expect(screen.queryByTestId("open-bill47qAXb6fIm2zOKkLzMro")).toBeNull();
    });
  });

  describe("When I click on a bill card", () => {
    test("Then the right form should be displayed", () => {
      openFirstPendingBill();
      expect(screen.getByTestId("dashboard-form")).toBeTruthy();
    });

    test("Then a second click should show the big billed icon instead", () => {
      openFirstPendingBill();
      userEvent.click(screen.getByTestId("open-bill47qAXb6fIm2zOKkLzMro"));
      expect(screen.getByTestId("big-billed-icon")).toBeTruthy();
    });
  });

  describe("When a pending bill is open", () => {
    test("Then clicking accept should update the bill and send me back to the Dashboard", () => {
      const dashboard = openFirstPendingBill();
      const acceptSpy = jest.spyOn(dashboard, "handleAcceptSubmit");

      userEvent.click(screen.getByTestId("btn-accept-bill-d"));

      expect(acceptSpy).toHaveBeenCalled();
      expect(screen.getByTestId("big-billed-icon")).toBeTruthy();
    });

    test("Then clicking refuse should update the bill and send me back to the Dashboard", () => {
      const dashboard = openFirstPendingBill();
      const refuseSpy = jest.spyOn(dashboard, "handleRefuseSubmit");

      userEvent.click(screen.getByTestId("btn-refuse-bill-d"));

      expect(refuseSpy).toHaveBeenCalled();
      expect(screen.getByTestId("big-billed-icon")).toBeTruthy();
    });
  });

  describe("When I click on the eye icon of an open bill", () => {
    beforeEach(() => {
      $.fn.modal = jest.fn();
    });

    afterEach(() => {
      delete $.fn.modal;
    });

    test("Then the modal should open with the bill proof", () => {
      openFirstPendingBill();

      userEvent.click(screen.getByTestId("icon-eye-d"));

      expect($.fn.modal).toHaveBeenCalledWith("show");
      expect(screen.getByAltText("Bill")).toBeTruthy();
    });

    test("Then the modal should still open after toggling the bill several times", () => {
      openFirstPendingBill();
      const billCard = screen.getByTestId("open-bill47qAXb6fIm2zOKkLzMro");

      userEvent.click(billCard); // close  ticket
      userEvent.click(billCard); // open ticket again

      userEvent.click(screen.getByTestId("icon-eye-d"));

      expect($.fn.modal).toHaveBeenCalledTimes(1);
      expect($.fn.modal).toHaveBeenCalledWith("show");
    });
  });
});

// -------- Integration router + mock API ----------------------

describe("Given I am a user connected as Admin", () => {
  describe("When I navigate to Dashboard", () => {
    test("Then it fetches bills from mock API GET", async () => {
      connectAsAdmin();
      window.localStorage.setItem(
        "user",
        JSON.stringify({ type: "Admin", email: "a@a" }),
      );
      document.body.innerHTML = "";
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Dashboard);

      await waitFor(() => screen.getByText("Validations"));
      expect(screen.getByText("En attente (1)")).toBeTruthy();
      expect(screen.getByText("Refusé (2)")).toBeTruthy();
      expect(screen.getByTestId("big-billed-icon")).toBeTruthy();
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        connectAsAdmin();
        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Admin", email: "a@a" }),
        );
        document.body.innerHTML = "";
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      test.each([
        ["Erreur 404", /Erreur 404/],
        ["Erreur 500", /Erreur 500/],
      ])(
        "Then it fails with %s message error",
        async (errorMessage, pattern) => {
          mockStore.bills.mockImplementationOnce(() => ({
            list: () => Promise.reject(new Error(errorMessage)),
          }));
          window.onNavigate(ROUTES_PATH.Dashboard);
          await new Promise(process.nextTick);
          expect(screen.getByText(pattern)).toBeTruthy();
        },
      );
    });
  });
});
