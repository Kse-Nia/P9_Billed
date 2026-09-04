import { fireEvent, screen, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom/extend-expect";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

jest.mock("../app/Store.js", () => mockStore);

// --- Helpers ---------------------------------------------------------------

// User employee connect and storage to LS
const connectAsEmployee = () => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  window.localStorage.setItem(
    "user",
    JSON.stringify({ type: "Employee", email: "employee@test.tld" }),
  );
};

// NewBill page
const setupNewBillPage = (store) => {
  document.body.innerHTML = NewBillUI();
  const onNavigate = jest.fn((pathname) => {
    document.body.innerHTML = ROUTES({ pathname });
  });
  const newBill = new NewBill({
    document,
    onNavigate,
    store,
    localStorage: window.localStorage,
  });
  return { newBill, onNavigate };
};

// Check inputs
const uploadFile = (fileName, type = "image/jpeg") => {
  const input = screen.getByTestId("file");
  const file = new File(["contenu du justificatif"], fileName, { type });
  Object.defineProperty(input, "value", {
    value: `C:\\fakepath\\${fileName}`,
    writable: true,
    configurable: true,
  });
  fireEvent.change(input, { target: { files: [file] } });
  return { input, file };
};

// All inputs are used
const fillForm = ({ pct = "20" } = {}) => {
  fireEvent.change(screen.getByTestId("expense-type"), {
    target: { value: "Transports" },
  });
  fireEvent.change(screen.getByTestId("expense-name"), {
    target: { value: "Train Paris-Lyon" },
  });
  fireEvent.change(screen.getByTestId("datepicker"), {
    target: { value: "2023-01-15" },
  });
  fireEvent.change(screen.getByTestId("amount"), { target: { value: "50" } });
  fireEvent.change(screen.getByTestId("vat"), { target: { value: "10" } });
  fireEvent.change(screen.getByTestId("pct"), { target: { value: pct } });
  fireEvent.change(screen.getByTestId("commentary"), {
    target: { value: "Déplacement professionnel" },
  });
};

const createStoreMock = () => {
  const billsMethods = {
    create: jest.fn().mockResolvedValue({
      fileUrl: "https://localhost:3456/images/test.jpg",
      key: "1234",
    }),
    update: jest.fn().mockResolvedValue({}),
  };
  return { bills: jest.fn(() => billsMethods), billsMethods };
};

const silenceConsoleError = () =>
  jest.spyOn(console, "error").mockImplementation(() => {});

beforeEach(() => {
  connectAsEmployee();
  jest.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  document.body.innerHTML = "";
});

// -------------------------------------- Tests unitaires -------------------------------------

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the mail icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      await waitFor(() => screen.getByTestId("icon-mail"));
      expect(screen.getByTestId("icon-mail")).toHaveClass("active-icon");
      expect(screen.getByTestId("icon-window")).not.toHaveClass("active-icon");
    });
  });

  // Check files extension
  describe("When I upload a file with a valid extension (jpg, jpeg, png)", () => {
    test.each([
      "justificatif.jpg",
      "justificatif.jpeg",
      "justificatif.png",
      "JUSTIFICATIF.PNG",
    ])("Then %s should be accepted and sent to the store", async (fileName) => {
      const store = createStoreMock();
      const { newBill } = setupNewBillPage(store);
      const input = screen.getByTestId("file");

      uploadFile(fileName);

      expect(window.alert).not.toHaveBeenCalled();
      expect(input.value).not.toBe("");
      expect(store.billsMethods.create).toHaveBeenCalledTimes(1);
      expect(store.billsMethods.create).toHaveBeenCalledWith({
        data: expect.any(FormData),
        headers: { noContentType: true },
      });

      const { data } = store.billsMethods.create.mock.calls[0][0];
      expect(data.get("file")).toBeInstanceOf(File);
      expect(data.has("email")).toBe(true);

      await waitFor(() => expect(newBill.fileName).toBe(fileName));
      expect(newBill.fileUrl).toBe("https://localhost:3456/images/test.jpg");
      expect(newBill.billId).toBe("1234");
    });
  });

  describe("When I upload a file with an invalid extension", () => {
    test.each(["justificatif.pdf", "justificatif.gif", "justificatif.txt"])(
      "Then %s should be rejected, the input cleared and nothing sent",
      (fileName) => {
        const store = createStoreMock();
        const { newBill } = setupNewBillPage(store);

        const { input } = uploadFile(fileName, "application/pdf");

        expect(window.alert).toHaveBeenCalledWith(
          "Format de fichier non valide, veuillez sélectionner une image au format JPG, JPEG ou PNG.",
        );
        expect(input.value).toBe("");
        expect(store.billsMethods.create).not.toHaveBeenCalled();
        expect(newBill.fileUrl).toBeNull();
        expect(newBill.fileName).toBeNull();
        expect(newBill.billId).toBeNull();
      },
    );
  });

  describe("When the store fails to create the bill", () => {
    test("Then the error should be caught and logged without crashing", async () => {
      const consoleError = silenceConsoleError();
      const store = createStoreMock();
      store.billsMethods.create.mockRejectedValueOnce(new Error("Erreur 500"));
      const { newBill } = setupNewBillPage(store);

      uploadFile("justificatif.jpg");

      await waitFor(() => expect(consoleError).toHaveBeenCalled());
      expect(newBill.fileUrl).toBeNull();
      expect(newBill.fileName).toBeNull();
    });
  });

  describe("When I submit the completed NewBill form", () => {
    test("Then the bill should be sent to the store and I should be redirected to Bills", async () => {
      const store = createStoreMock();
      const { newBill, onNavigate } = setupNewBillPage(store);

      uploadFile("justificatif.jpg");
      await waitFor(() => expect(newBill.fileName).toBe("justificatif.jpg"));
      fillForm();
      fireEvent.submit(screen.getByTestId("form-new-bill"));

      expect(store.billsMethods.update).toHaveBeenCalledTimes(1);

      const { data, selector } = store.billsMethods.update.mock.calls[0][0];
      expect(selector).toBe("1234");
      expect(JSON.parse(data)).toEqual(
        expect.objectContaining({
          type: "Transports",
          name: "Train Paris-Lyon",
          date: "2023-01-15",
          amount: 50,
          vat: "10",
          pct: 20,
          commentary: "Déplacement professionnel",
          fileUrl: "https://localhost:3456/images/test.jpg",
          fileName: "justificatif.jpg",
          status: "pending",
        }),
      );
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });

    test("Then pct should default to 20 when the field is left empty", () => {
      const store = createStoreMock();
      setupNewBillPage(store);

      fillForm({ pct: "" });
      fireEvent.submit(screen.getByTestId("form-new-bill"));

      const { data } = store.billsMethods.update.mock.calls[0][0];
      expect(JSON.parse(data).pct).toBe(20);
    });

    test("Then no request should be sent when the store is not available", () => {
      document.body.innerHTML = NewBillUI();
      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      fillForm();
      expect(() =>
        fireEvent.submit(screen.getByTestId("form-new-bill")),
      ).not.toThrow();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
      expect(newBill.billId).toBeNull();
    });
  });
});

// ------------------------------------ Tests d'intégration -------------------------

describe("Given I am a user connected as an employee", () => {
  describe("When I submit a new bill on the NewBill page", () => {
    test("Then the bill should be posted to the mock API and I should land on the Bills page", async () => {
      const createSpy = jest.spyOn(mockStore.bills(), "create");
      const updateSpy = jest.spyOn(mockStore.bills(), "update");

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("form-new-bill"));

      uploadFile("justificatif.jpg");
      await waitFor(() => expect(createSpy).toHaveBeenCalled());
      fillForm();
      fireEvent.submit(screen.getByTestId("form-new-bill"));

      expect(updateSpy).toHaveBeenCalled();
      await waitFor(() =>
        expect(screen.getByText("Mes notes de frais")).toBeInTheDocument(),
      );
    });

    test.each(["Erreur 404", "Erreur 500"])(
      "Then it should log an error when the API fails with: %s",
      async (errorMessage) => {
        const consoleError = silenceConsoleError();
        jest
          .spyOn(mockStore.bills(), "update")
          .mockRejectedValueOnce(new Error(errorMessage));

        setupNewBillPage(mockStore);
        fillForm();
        fireEvent.submit(screen.getByTestId("form-new-bill"));

        await waitFor(() =>
          expect(consoleError).toHaveBeenCalledWith(new Error(errorMessage)),
        );
      },
    );
  });
});
