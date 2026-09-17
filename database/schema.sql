IF DB_ID (N'FactoryQueueDb') IS NULL BEGIN
CREATE DATABASE FactoryQueueDb;

END;
GO

USE FactoryQueueDb;
GO

IF OBJECT_ID (N'dbo.users', N'U') IS NULL BEGIN
CREATE TABLE dbo.users (
    id INT IDENTITY (1, 1) NOT NULL,
    full_name NVARCHAR (150) NOT NULL,
    email NVARCHAR (320) NOT NULL,
    password_hash NVARCHAR (255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at DATETIME2 (0) NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME (),
    updated_at DATETIME2 (0) NOT NULL CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_users PRIMARY KEY (id),
    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT CK_users_role CHECK (role IN ('DRIVER', 'ADMIN'))
);

END;
GO

IF OBJECT_ID (N'dbo.vehicles', N'U') IS NULL BEGIN
CREATE TABLE dbo.vehicles (
    id INT IDENTITY (1, 1) NOT NULL,
    plate_number NVARCHAR (20) NOT NULL,
    driver_id INT NOT NULL,
    created_at DATETIME2 (0) NOT NULL CONSTRAINT DF_vehicles_created_at DEFAULT SYSUTCDATETIME (),
    updated_at DATETIME2 (0) NOT NULL CONSTRAINT DF_vehicles_updated_at DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_vehicles PRIMARY KEY (id),
    CONSTRAINT UQ_vehicles_plate_number UNIQUE (plate_number),
    CONSTRAINT FK_vehicles_driver FOREIGN KEY (driver_id) REFERENCES dbo.users (id)
);

END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE
        name = N'IX_vehicles_driver_id'
        AND object_id = OBJECT_ID (N'dbo.vehicles')
) BEGIN
CREATE INDEX IX_vehicles_driver_id ON dbo.vehicles (driver_id);

END;
GO

IF OBJECT_ID (N'dbo.shipments', N'U') IS NULL BEGIN
CREATE TABLE dbo.shipments (
    id INT IDENTITY (1, 1) NOT NULL,
    vehicle_id INT NOT NULL,
    material_name NVARCHAR (150) NOT NULL,
    status VARCHAR(30) NOT NULL CONSTRAINT DF_shipments_status DEFAULT 'YOLDA',
    queue_number INT NULL,
    arrival_time DATETIME2 (0) NULL,
    completed_at DATETIME2 (0) NULL,
    created_at DATETIME2 (0) NOT NULL CONSTRAINT DF_shipments_created_at DEFAULT SYSUTCDATETIME (),
    updated_at DATETIME2 (0) NOT NULL CONSTRAINT DF_shipments_updated_at DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_shipments PRIMARY KEY (id),
    CONSTRAINT FK_shipments_vehicle FOREIGN KEY (vehicle_id) REFERENCES dbo.vehicles (id),
    CONSTRAINT CK_shipments_status CHECK (
        status IN (
            'YOLDA',
            'SIRADA',
            'KANTARA_CAGRILDI',
            'KANTARDA',
            'BOSALTIMDA',
            'BOSALTIM_TAMAMLANDI',
            'TAMAMLANDI'
        )
    ),
    CONSTRAINT CK_shipments_queue_number CHECK (
        queue_number IS NULL
        OR queue_number > 0
    ),
    CONSTRAINT CK_shipments_arrival_data CHECK (
        (
            status = 'YOLDA'
            AND queue_number IS NULL
            AND arrival_time IS NULL
        )
        OR (
            status <> 'YOLDA'
            AND queue_number IS NOT NULL
            AND arrival_time IS NOT NULL
        )
    )
);

END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE
        name = N'IX_shipments_vehicle_status'
        AND object_id = OBJECT_ID (N'dbo.shipments')
) BEGIN
CREATE INDEX IX_shipments_vehicle_status ON dbo.shipments (vehicle_id, status);

END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE
        name = N'IX_shipments_status_arrival'
        AND object_id = OBJECT_ID (N'dbo.shipments')
) BEGIN
CREATE INDEX IX_shipments_status_arrival ON dbo.shipments (status, arrival_time) INCLUDE (
    vehicle_id,
    queue_number,
    material_name
);

END;
GO

IF OBJECT_ID (N'dbo.weighing_records', N'U') IS NULL BEGIN
CREATE TABLE dbo.weighing_records (
    id INT IDENTITY (1, 1) NOT NULL,
    shipment_id INT NOT NULL,
    gross_weight DECIMAL(12, 2) NULL,
    tare_weight DECIMAL(12, 2) NULL,
    net_weight DECIMAL(12, 2) NULL,
    gross_weighed_at DATETIME2 (0) NULL,
    tare_weighed_at DATETIME2 (0) NULL,
    created_at DATETIME2 (0) NOT NULL CONSTRAINT DF_weighing_records_created_at DEFAULT SYSUTCDATETIME (),
    updated_at DATETIME2 (0) NOT NULL CONSTRAINT DF_weighing_records_updated_at DEFAULT SYSUTCDATETIME (),
    CONSTRAINT PK_weighing_records PRIMARY KEY (id),
    CONSTRAINT UQ_weighing_records_shipment UNIQUE (shipment_id),
    CONSTRAINT FK_weighing_records_shipment FOREIGN KEY (shipment_id) REFERENCES dbo.shipments (id),
    CONSTRAINT CK_weighing_records_gross_positive CHECK (
        gross_weight IS NULL
        OR gross_weight > 0
    ),
    CONSTRAINT CK_weighing_records_tare_positive CHECK (
        tare_weight IS NULL
        OR tare_weight > 0
    ),
    CONSTRAINT CK_weighing_records_gross_time CHECK (
        (
            gross_weight IS NULL
            AND gross_weighed_at IS NULL
        )
        OR (
            gross_weight IS NOT NULL
            AND gross_weighed_at IS NOT NULL
        )
    ),
    CONSTRAINT CK_weighing_records_tare_time CHECK (
        (
            tare_weight IS NULL
            AND tare_weighed_at IS NULL
        )
        OR (
            tare_weight IS NOT NULL
            AND tare_weighed_at IS NOT NULL
        )
    ),
    CONSTRAINT CK_weighing_records_net CHECK (
        (
            tare_weight IS NULL
            AND net_weight IS NULL
        )
        OR (
            gross_weight IS NOT NULL
            AND tare_weight IS NOT NULL
            AND gross_weight >= tare_weight
            AND net_weight = gross_weight - tare_weight
        )
    )
);

END;
GO