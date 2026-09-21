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
GO
