-- Скрипт для очистки существующих эмбеддингов
-- Для запуска в Supabase SQL Editor

-- Удаляем все существующие эмбеддинги, сохраняя структуру таблиц
TRUNCATE TABLE usage_embeddings;
TRUNCATE TABLE code_embeddings;

-- Создаем возможность отслеживать прогресс генерации
CREATE TABLE IF NOT EXISTS embedding_generation_status (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('component', 'demo')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Очищаем таблицу статусов, если она уже существует
TRUNCATE TABLE embedding_generation_status;

-- Заполняем таблицу статусов для всех компонентов
INSERT INTO embedding_generation_status (item_id, item_type, status)
SELECT id, 'component', 'pending' FROM components;

-- Заполняем таблицу статусов для всех демо
INSERT INTO embedding_generation_status (item_id, item_type, status)
SELECT id, 'demo', 'pending' FROM demos;

-- Создаем индекс для быстрого поиска по статусу
CREATE INDEX IF NOT EXISTS embedding_status_idx ON embedding_generation_status(status); 