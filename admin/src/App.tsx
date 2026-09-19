import { useEffect, useState, type FormEvent } from "react";
import "./App.css";

import { getCurrentAdmin, loginAdmin } from "./services/authService";
import {
  getAdminShipments,
  updateAdminShipmentStatus,
} from "./services/shipmentService";

import type { AuthUser } from "./types/auth";
import type {
  AdminManagedShipmentStatus,
  AdminShipment,
  ShipmentStatus,
} from "./types/shipment";

const statusLabels: Record<ShipmentStatus, string> = {
  YOLDA: "Yolda",
  SIRADA: "Sırada",
  KANTARA_CAGRILDI: "Kantara çağrıldı",
  KANTARDA: "Kantarda",
  BOSALTIMDA: "Boşaltımda",
  BOSALTIM_TAMAMLANDI: "Boşaltım tamamlandı",
  TAMAMLANDI: "Tamamlandı",
};

const nextStatusByStatus: Partial<
  Record<ShipmentStatus, AdminManagedShipmentStatus>
> = {
  SIRADA: "KANTARA_CAGRILDI",
  KANTARA_CAGRILDI: "KANTARDA",
  KANTARDA: "BOSALTIMDA",
  BOSALTIMDA: "BOSALTIM_TAMAMLANDI",
  BOSALTIM_TAMAMLANDI: "TAMAMLANDI",
};

const actionLabels: Partial<Record<ShipmentStatus, string>> = {
  SIRADA: "Kantara Çağır",
  KANTARA_CAGRILDI: "Kantara Al",
  KANTARDA: "Boşaltıma Gönder",
  BOSALTIMDA: "Boşaltımı Tamamla",
  BOSALTIM_TAMAMLANDI: "Sevkiyatı Tamamla",
};

function App() {
  const [email, setEmail] = useState("admin@factory.local");
  const [password, setPassword] = useState("Admin123!");

  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState("");

  const [shipments, setShipments] = useState<AdminShipment[]>([]);

  const [loginError, setLoginError] = useState("");
  const [shipmentError, setShipmentError] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingShipments, setIsLoadingShipments] = useState(false);

  const [updatingShipmentId, setUpdatingShipmentId] = useState<number | null>(
    null,
  );

  async function loadShipments(
    authenticationToken: string,
    showLoading = true,
  ) {
    setShipmentError("");

    if (showLoading) {
      setIsLoadingShipments(true);
    }

    try {
      const activeShipments = await getAdminShipments(authenticationToken);

      setShipments(activeShipments);
    } catch (error) {
      setShipmentError(
        error instanceof Error ? error.message : "Sevkiyatlar alınamadı.",
      );
    } finally {
      if (showLoading) {
        setIsLoadingShipments(false);
      }
    }
  }

  useEffect(() => {
    const storedToken = localStorage.getItem("adminToken");

    if (!storedToken) {
      setIsCheckingSession(false);
      return;
    }

    async function restoreSession() {
      try {
        const currentUser = await getCurrentAdmin(storedToken!);

        setToken(storedToken!);
        setUser(currentUser);

        await loadShipments(storedToken!);
      } catch {
        localStorage.removeItem("adminToken");
        setToken("");
        setUser(null);
      } finally {
        setIsCheckingSession(false);
      }
    }

    void restoreSession();
  }, []);

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadShipments(token, false);
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user, token]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoginError("");
    setIsLoggingIn(true);

    try {
      const response = await loginAdmin(email.trim(), password);

      localStorage.setItem("adminToken", response.token);

      setToken(response.token);
      setUser(response.user);

      await loadShipments(response.token);
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "Giriş sırasında bir hata oluştu.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleStatusUpdate(shipment: AdminShipment) {
    const nextStatus = nextStatusByStatus[shipment.status];

    if (!nextStatus || !token) {
      return;
    }

    setShipmentError("");
    setUpdatingShipmentId(shipment.id);

    try {
      await updateAdminShipmentStatus(shipment.id, nextStatus, token);

      await loadShipments(token);
    } catch (error) {
      setShipmentError(
        error instanceof Error
          ? error.message
          : "Sevkiyat durumu güncellenemedi.",
      );
    } finally {
      setUpdatingShipmentId(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem("adminToken");

    setUser(null);
    setToken("");
    setShipments([]);
    setPassword("");
  }
  if (isCheckingSession) {
    return (
      <main className="loginPage">
        <section className="loginCard">
          <div className="loginHeading">
            <p className="eyebrow">FABRİKA SIRA SİSTEMİ</p>

            <h1>Oturum kontrol ediliyor...</h1>

            <p>Lütfen kısa bir süre bekleyin.</p>
          </div>
        </section>
      </main>
    );
  }
  if (!user) {
    return (
      <main className="loginPage">
        <section className="loginCard">
          <div className="loginHeading">
            <p className="eyebrow">FABRİKA SIRA SİSTEMİ</p>

            <h1>Yönetici Girişi</h1>

            <p>Sevkiyat ve araç sırasını yönetmek için giriş yapın.</p>
          </div>

          <form className="loginForm" onSubmit={handleLogin}>
            <label htmlFor="email">E-posta</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="password">Şifre</label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            {loginError && <p className="errorMessage">{loginError}</p>}

            <button
              className="loginButton"
              type="submit"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboardPage">
      <header className="dashboardHeader">
        <div>
          <p className="eyebrow">FABRİKA SIRA SİSTEMİ</p>

          <h1>Aktif Sevkiyatlar</h1>

          <p>Hoş geldiniz, {user.fullName}</p>
        </div>

        <div className="headerActions">
          <button
            className="refreshButton"
            type="button"
            onClick={() => loadShipments(token)}
            disabled={isLoadingShipments}
          >
            Yenile
          </button>

          <button className="logoutButton" type="button" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </header>

      {shipmentError && <p className="errorMessage">{shipmentError}</p>}

      {isLoadingShipments && shipments.length === 0 ? (
        <section className="emptyCard">
          <h2>Sevkiyatlar yükleniyor...</h2>
        </section>
      ) : shipments.length === 0 ? (
        <section className="emptyCard">
          <h2>Aktif sevkiyat bulunmuyor</h2>

          <p>Yeni sevkiyat oluşturulduğunda burada görüntülenecek.</p>
        </section>
      ) : (
        <section className="tableCard">
          <div className="tableHeading">
            <div>
              <h2>Sevkiyat listesi</h2>
              <p>Toplam {shipments.length} aktif sevkiyat</p>
            </div>
          </div>

          <div className="shipmentTableWrapper">
            <table className="shipmentTable">
              <thead>
                <tr>
                  <th>Sıra</th>
                  <th>Plaka</th>
                  <th>Şoför</th>
                  <th>Malzeme</th>
                  <th>Durum</th>
                  <th>İşlem</th>
                </tr>
              </thead>

              <tbody>
                {shipments.map((shipment) => {
                  const actionLabel = actionLabels[shipment.status];

                  return (
                    <tr key={shipment.id}>
                      <td>{shipment.queueNumber ?? "-"}</td>

                      <td>
                        <strong>{shipment.plateNumber}</strong>
                      </td>

                      <td>
                        <div>{shipment.driverName}</div>

                        <small>{shipment.driverEmail}</small>
                      </td>

                      <td>{shipment.materialName}</td>

                      <td>
                        <span className="statusBadge">
                          {statusLabels[shipment.status]}
                        </span>
                      </td>

                      <td>
                        {actionLabel ? (
                          <button
                            className="actionButton"
                            type="button"
                            disabled={updatingShipmentId === shipment.id}
                            onClick={() => handleStatusUpdate(shipment)}
                          >
                            {updatingShipmentId === shipment.id
                              ? "Güncelleniyor..."
                              : actionLabel}
                          </button>
                        ) : (
                          <span className="waitingText">Şoför bekleniyor</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
