-- Message Send History Table
-- 관리자 메시지 발송 기록 저장

CREATE TABLE public.message_send_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    church_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL, -- 발송한 관리자 member_id
    sender_name VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    recipient_member_ids INTEGER[] NOT NULL, -- 선택된 교인 ID 배열
    recipient_count INTEGER NOT NULL, -- 선택된 교인 수
    app_user_count INTEGER DEFAULT 0, -- 앱 사용자 수
    devices_sent INTEGER DEFAULT 0, -- 발송한 디바이스 수
    devices_failed INTEGER DEFAULT 0, -- 발송 실패한 디바이스 수
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_message_send_history_church_id ON public.message_send_history(church_id);
CREATE INDEX idx_message_send_history_sender_id ON public.message_send_history(sender_id);
CREATE INDEX idx_message_send_history_sent_at ON public.message_send_history(sent_at DESC);

-- RLS policies
ALTER TABLE public.message_send_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated access to message_send_history" ON public.message_send_history
    FOR ALL USING (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE public.message_send_history IS '관리자 메시지 발송 기록';
COMMENT ON COLUMN public.message_send_history.recipient_member_ids IS '발송 대상 교인 ID 배열';
COMMENT ON COLUMN public.message_send_history.devices_sent IS 'FCM 발송 성공한 디바이스 수';
COMMENT ON COLUMN public.message_send_history.devices_failed IS 'FCM 발송 실패한 디바이스 수';
