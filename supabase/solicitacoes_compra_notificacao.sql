-- Campos de controle de envio do e-mail de aviso (mesmo padrão usado em
-- aplicacoes_mentoria / notificar-mentoria): evita reenvio duplicado e
-- registra o erro quando o envio falha.
alter table solicitacoes_compra add column if not exists email_notificacao_em timestamptz;
alter table solicitacoes_compra add column if not exists email_notificacao_erro text;
