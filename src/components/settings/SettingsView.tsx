import { Download, PlugZap, RotateCcw, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { useObsStore } from "../../store/useObsStore";
import { appConfigSchema } from "../../schemas/config.schema";
import { validateConfig } from "../../lib/sequence/validators";
import { useT } from "../../lib/i18n/translations";
import { Button } from "../ui/Button";
import { Field, Input, Textarea } from "../ui/Field";

export const SettingsView = () => {
  const { config, replaceConfig, resetConfig, logs, addLog } = useAppStore();
  const obs = useObsStore();
  const t = useT();
  const [url, setUrl] = useState(obs.settings.url);
  const [password, setPassword] = useState(obs.settings.password);
  const [importText, setImportText] = useState("");
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const issues = useMemo(() => validateConfig(config, obs.state, obs.sceneSources), [config, obs.state, obs.sceneSources]);

  const connect = async () => {
    try {
      await obs.connect({ url, password });
      addLog("success", "Connected to OBS WebSocket");
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Connection failed");
    }
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    if (downloadRef.current) {
      downloadRef.current.href = href;
      downloadRef.current.download = `parish-obs-config-${new Date().toISOString().slice(0, 10)}.json`;
      downloadRef.current.click();
    }
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  const importConfig = async () => {
    try {
      const parsed = appConfigSchema.parse(JSON.parse(importText));
      await replaceConfig(parsed);
      addLog("success", "Config imported");
      setImportText("");
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Import failed");
    }
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[420px_1fr]">
      <section className="grid gap-3">
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/72 p-3 shadow-glow backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-black text-white">{t("obsWebSocket")}</h2>
          <div className="grid gap-3">
            <Field label={t("url")}><Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="ws://127.0.0.1:4455" /></Field>
            <Field label={t("password")}><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" icon={<PlugZap className="h-4 w-4" />} onClick={connect}>{obs.connecting ? t("connecting") : t("connect")}</Button>
              <Button onClick={obs.disconnect}>{t("disconnect")}</Button>
            </div>
            {obs.error ? <p className="rounded-xl bg-rose-500/15 p-2 text-sm text-rose-100">{obs.error}</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/72 p-3 shadow-glow backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-black text-white">{t("importExport")}</h2>
          <div className="grid gap-2">
            <Button icon={<Download className="h-4 w-4" />} onClick={exportConfig}>{t("exportConfig")}</Button>
            <a ref={downloadRef} className="hidden" />
            <Textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder={t("pasteJson")} />
            <Button icon={<Upload className="h-4 w-4" />} onClick={importConfig}>{t("importConfig")}</Button>
            <Button variant="warning" icon={<RotateCcw className="h-4 w-4" />} onClick={() => resetConfig().then(() => addLog("warning", "Config reset to sample"))}>{t("resetSampleConfig")}</Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/72 p-3 shadow-glow backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-black text-white">{t("validation")}</h2>
          <div className="grid gap-2">
            {issues.length ? issues.map((issue) => (
              <div key={issue.message} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${issue.level === "error" ? "border-rose-400/40 bg-rose-500/10 text-rose-100" : "border-amber-400/40 bg-amber-500/10 text-amber-100"}`}>{issue.translationKey ? t(issue.translationKey, issue.values) : issue.message}</div>
            )) : <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-100">{t("noValidationIssues")}</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/72 p-3 shadow-glow backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-black text-white">{t("log")}</h2>
          <div className="grid max-h-[460px] gap-2 overflow-auto">
            {logs.map((log) => (
              <div key={log.id} className="rounded-xl bg-slate-950/58 px-3 py-2 text-sm text-slate-300">
                <span className="mr-2 font-black uppercase text-slate-500">{log.level}</span>
                {log.message}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
