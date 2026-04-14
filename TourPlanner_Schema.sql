DROP DATABASE IF EXISTS tourplanner WITH (FORCE);
CREATE DATABASE tourplanner;
\c tourplanner;

DROP TYPE IF EXISTS transport_type CASCADE;
CREATE TYPE transport_type AS ENUM ('car', 'bike', 'hike', 'running', 'walking');

DROP TYPE IF EXISTS difficulty_level CASCADE;
CREATE TYPE difficulty_level AS ENUM ('easy', 'moderate', 'hard', 'expert');

DROP TABLE IF EXISTS tours CASCADE;
CREATE TABLE tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    from_location VARCHAR(200) NOT NULL,
    to_location VARCHAR(200) NOT NULL,
    transport_type transport_type NOT NULL,
    distance_km DECIMAL(10, 2),
    estimated_time_minutes INTEGER,
    image VARCHAR(2000),
    route_image_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS tour_logs CASCADE;
CREATE TABLE tour_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comment TEXT,
    difficulty difficulty_level NOT NULL,
    total_distance_km DECIMAL(10, 2) NOT NULL,
    total_time_minutes INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tours_name ON tours(name);
CREATE INDEX idx_logs_tour_id ON tour_logs(tour_id);
