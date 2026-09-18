USE FactoryQueueDb;
GO

SET NOCOUNT ON;

-- Yalnızca yerel geliştirme ortamında kullanılan admin hesabı.
IF NOT EXISTS (
    SELECT 1
    FROM dbo.users
    WHERE
        email = N'admin@factory.local'
) BEGIN
INSERT INTO
    dbo.users (
        full_name,
        email,
        password_hash,
        role
    )
VALUES (
        N'Sistem Yöneticisi',
        N'admin@factory.local',
        N'$2b$12$Zo43N4SxN2gDPWIRXSLHsuc6V0k9HF.1SRgPHAu6aD/VVH4QTiyqK',
        'ADMIN'
    );

PRINT N'Geliştirme admin hesabı oluşturuldu.';

END ELSE BEGIN PRINT N'Geliştirme admin hesabı zaten var.';

END;

IF NOT EXISTS (
    SELECT 1
    FROM dbo.users
    WHERE
        role = 'DRIVER'
) BEGIN THROW 50001,
N'Örnek sevkiyat için önce bir şoför kaydı oluşturulmalıdır.',
1;

END;

INSERT INTO
    dbo.shipments (
        vehicle_id,
        material_name,
        status
    )
SELECT vehicles.id, N'Çimento', 'YOLDA'
FROM dbo.vehicles AS vehicles
    INNER JOIN dbo.users AS users ON users.id = vehicles.driver_id
WHERE
    users.role = 'DRIVER'
    AND NOT EXISTS (
        SELECT 1
        FROM dbo.shipments AS shipments
        WHERE
            shipments.vehicle_id = vehicles.id
            AND shipments.status <> 'TAMAMLANDI'
    );

DECLARE @inserted_count INT = @@ROWCOUNT;

IF @inserted_count = 0
BEGIN
    PRINT N'Tüm şoförlerin zaten aktif sevkiyatı var.';
END

ELSE BEGIN PRINT CONCAT(
    @inserted_count,
    N' adet örnek aktif sevkiyat oluşturuldu.'
);

END;
GO