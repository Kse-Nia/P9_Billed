/**
 * @jest-environment jsdom
 */

import LoginUI from "../views/LoginUI";
import Login from "../containers/Login.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { fireEvent, screen, waitFor } from "@testing-library/dom";

// localStorage minimal, avec jest.fn() pour espionner les écritures
const fakeLocalStorage = () => ({
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
});

describe("Given that I am a user on login page", () => {
  describe("When I do not fill fields and I click on employee button Login In", () => {
    test("Then It should renders Login page", () => {
      document.body.innerHTML = LoginUI();

      const inputEmailUser = screen.getByTestId("employee-email-input");
      expect(inputEmailUser.value).toBe("");

      const inputPasswordUser = screen.getByTestId("employee-password-input");
      expect(inputPasswordUser.value).toBe("");

      const form = screen.getByTestId("form-employee");
      const handleSubmit = jest.fn((e) => e.preventDefault());

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(screen.getByTestId("form-employee")).toBeTruthy();
    });
  });

  describe("When I do fill fields in incorrect format and I click on employee button Login In", () => {
    test("Then It should renders Login page", () => {
      document.body.innerHTML = LoginUI();

      const inputEmailUser = screen.getByTestId("employee-email-input");
      fireEvent.change(inputEmailUser, { target: { value: "pasunemail" } });
      expect(inputEmailUser.value).toBe("pasunemail");

      const inputPasswordUser = screen.getByTestId("employee-password-input");
      fireEvent.change(inputPasswordUser, { target: { value: "azerty" } });
      expect(inputPasswordUser.value).toBe("azerty");

      const form = screen.getByTestId("form-employee");
      const handleSubmit = jest.fn((e) => e.preventDefault());

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(screen.getByTestId("form-employee")).toBeTruthy();
    });
  });

  describe("When I do fill fields in correct format and I click on employee button Login In", () => {
    test("Then I should be identified as an Employee in app", () => {
      document.body.innerHTML = LoginUI();
      const inputData = {
        email: "johndoe@email.com",
        password: "azerty",
      };

      const inputEmailUser = screen.getByTestId("employee-email-input");
      fireEvent.change(inputEmailUser, { target: { value: inputData.email } });
      expect(inputEmailUser.value).toBe(inputData.email);

      const inputPasswordUser = screen.getByTestId("employee-password-input");
      fireEvent.change(inputPasswordUser, {
        target: { value: inputData.password },
      });
      expect(inputPasswordUser.value).toBe(inputData.password);

      const form = screen.getByTestId("form-employee");

      // localStorage should be populated with form data
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: jest.fn(() => null),
          setItem: jest.fn(() => null),
        },
        writable: true,
      });

      // we have to mock navigation to test it
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      let PREVIOUS_LOCATION = "";

      const store = jest.fn();

      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION,
        store,
      });

      const handleSubmit = jest.fn(login.handleSubmitEmployee);
      login.login = jest.fn().mockResolvedValue({});
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
      expect(window.localStorage.setItem).toHaveBeenCalled();
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify({
          type: "Employee",
          email: inputData.email,
          password: inputData.password,
          status: "connected",
        })
      );
    });

    test("It should renders Bills page", () => {
      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
    });
  });
});

describe("Given that I am a user on login page", () => {
  describe("When I do not fill fields and I click on admin button Login In", () => {
    test("Then It should renders Login page", () => {
      document.body.innerHTML = LoginUI();

      const inputEmailUser = screen.getByTestId("admin-email-input");
      expect(inputEmailUser.value).toBe("");

      const inputPasswordUser = screen.getByTestId("admin-password-input");
      expect(inputPasswordUser.value).toBe("");

      const form = screen.getByTestId("form-admin");
      const handleSubmit = jest.fn((e) => e.preventDefault());

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(screen.getByTestId("form-admin")).toBeTruthy();
    });
  });

  describe("When I do fill fields in incorrect format and I click on admin button Login In", () => {
    test("Then it should renders Login page", () => {
      document.body.innerHTML = LoginUI();

      const inputEmailUser = screen.getByTestId("admin-email-input");
      fireEvent.change(inputEmailUser, { target: { value: "pasunemail" } });
      expect(inputEmailUser.value).toBe("pasunemail");

      const inputPasswordUser = screen.getByTestId("admin-password-input");
      fireEvent.change(inputPasswordUser, { target: { value: "azerty" } });
      expect(inputPasswordUser.value).toBe("azerty");

      const form = screen.getByTestId("form-admin");
      const handleSubmit = jest.fn((e) => e.preventDefault());

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(screen.getByTestId("form-admin")).toBeTruthy();
    });
  });

  describe("When I do fill fields in correct format and I click on admin button Login In", () => {
    test("Then I should be identified as an HR admin in app", () => {
      document.body.innerHTML = LoginUI();
      const inputData = {
        type: "Admin",
        email: "johndoe@email.com",
        password: "azerty",
        status: "connected",
      };

      const inputEmailUser = screen.getByTestId("admin-email-input");
      fireEvent.change(inputEmailUser, { target: { value: inputData.email } });
      expect(inputEmailUser.value).toBe(inputData.email);

      const inputPasswordUser = screen.getByTestId("admin-password-input");
      fireEvent.change(inputPasswordUser, {
        target: { value: inputData.password },
      });
      expect(inputPasswordUser.value).toBe(inputData.password);

      const form = screen.getByTestId("form-admin");

      // localStorage should be populated with form data
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: jest.fn(() => null),
          setItem: jest.fn(() => null),
        },
        writable: true,
      });

      // we have to mock navigation to test it
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      let PREVIOUS_LOCATION = "";

      const store = jest.fn();

      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION,
        store,
      });

      const handleSubmit = jest.fn(login.handleSubmitAdmin);
      login.login = jest.fn().mockResolvedValue({});
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
      expect(window.localStorage.setItem).toHaveBeenCalled();
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify({
          type: "Admin",
          email: inputData.email,
          password: inputData.password,
          status: "connected",
        })
      );
    });

    test("It should renders HR dashboard page", () => {
      expect(screen.queryByText("Validations")).toBeTruthy();
    });
  });
});

describe("Given that I am a user whose account does not exist yet", () => {
  describe("When I submit the employee form with correct credentials", () => {
    test("Then handleSubmitEmployee should create my account before navigating to Bills", async () => {
      document.body.innerHTML = LoginUI();
      fireEvent.change(screen.getByTestId("employee-email-input"), {
        target: { value: "newemployee@email.com" },
      });
      fireEvent.change(screen.getByTestId("employee-password-input"), {
        target: { value: "azerty" },
      });

      Object.defineProperty(window, "localStorage", {
        value: fakeLocalStorage(),
        writable: true,
      });
      const onNavigate = jest.fn();
      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store: jest.fn(),
      });
      // Le compte n'existe pas encore : login() échoue, ce qui doit déclencher createUser()
      login.login = jest.fn().mockRejectedValue(new Error("account not found"));
      login.createUser = jest.fn().mockResolvedValue({});

      fireEvent.submit(screen.getByTestId("form-employee"));

      await waitFor(() => expect(login.createUser).toHaveBeenCalled());
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });
  });

  describe("When I submit the admin form with correct credentials", () => {
    test("Then handleSubmitAdmin should create my account before navigating to Dashboard", async () => {
      document.body.innerHTML = LoginUI();
      fireEvent.change(screen.getByTestId("admin-email-input"), {
        target: { value: "newadmin@email.com" },
      });
      fireEvent.change(screen.getByTestId("admin-password-input"), {
        target: { value: "azerty" },
      });

      Object.defineProperty(window, "localStorage", {
        value: fakeLocalStorage(),
        writable: true,
      });
      const onNavigate = jest.fn();
      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store: jest.fn(),
      });
      login.login = jest.fn().mockRejectedValue(new Error("account not found"));
      login.createUser = jest.fn().mockResolvedValue({});

      fireEvent.submit(screen.getByTestId("form-admin"));

      await waitFor(() => expect(login.createUser).toHaveBeenCalled());
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Dashboard"]);
    });
  });
});

describe("Given the Login container is used with a real store", () => {
  describe("When I call login with a store", () => {
    test("Then it should post the credentials and store the returned jwt", async () => {
      Object.defineProperty(window, "localStorage", {
        value: fakeLocalStorage(),
        writable: true,
      });
      document.body.innerHTML = LoginUI();
      const store = { login: jest.fn().mockResolvedValue({ jwt: "abc-jwt-token" }) };
      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate: jest.fn(),
        PREVIOUS_LOCATION: "",
        store,
      });

      await login.login({ email: "a@a", password: "azerty" });

      expect(store.login).toHaveBeenCalledWith(
        JSON.stringify({ email: "a@a", password: "azerty" }),
      );
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "jwt",
        "abc-jwt-token",
      );
    });
  });

  describe("When I call login without a store", () => {
    test("Then it should return null", () => {
      document.body.innerHTML = LoginUI();
      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate: jest.fn(),
        PREVIOUS_LOCATION: "",
        store: null,
      });

      expect(login.login({ email: "a@a", password: "azerty" })).toBeNull();
    });
  });

  describe("When I call createUser with a store", () => {
    test("Then it should create the user in the store and log them in", async () => {
      const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
      Object.defineProperty(window, "localStorage", {
        value: fakeLocalStorage(),
        writable: true,
      });
      document.body.innerHTML = LoginUI();
      const create = jest.fn().mockResolvedValue({});
      const store = {
        users: () => ({ create }),
        login: jest.fn().mockResolvedValue({ jwt: "new-jwt-token" }),
      };
      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate: jest.fn(),
        PREVIOUS_LOCATION: "",
        store,
      });

      await login.createUser({
        type: "Employee",
        email: "new.employee@email.com",
        password: "azerty",
      });

      expect(create).toHaveBeenCalledWith({
        data: JSON.stringify({
          type: "Employee",
          name: "new.employee",
          email: "new.employee@email.com",
          password: "azerty",
        }),
      });
      expect(consoleLog).toHaveBeenCalledWith(
        "User with new.employee@email.com is created",
      );
      expect(store.login).toHaveBeenCalled();
    });
  });

  describe("When I call createUser without a store", () => {
    test("Then it should return null", () => {
      document.body.innerHTML = LoginUI();
      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate: jest.fn(),
        PREVIOUS_LOCATION: "",
        store: null,
      });

      expect(
        login.createUser({ type: "Employee", email: "a@a", password: "x" }),
      ).toBeNull();
    });
  });
});
