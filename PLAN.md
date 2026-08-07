# 🛡️ Aegis AI: Plan of Action

Aegis is an autonomous SRE (Site Reliability Engineering) agent designed to bridge the gap between local infrastructure and cloud-grade observability. It uses a **Hybrid-Cloud** approach: keeping expensive AI compute local while utilizing Google Cloud's managed monitoring for global availability.

---

## 1. GCP: The External Watchman
Google Cloud acts as the "remote sensor" that stays awake 24/7, even if your local machine is under heavy load.
* **Action:** Enable the **Cloud Monitoring API** in project `<YOUR_GCP_PROJECT_ID>`.
* **Infrastructure:** Utilize **GCP Managed Service for Prometheus (GMP)**. This provides a managed endpoint that accepts metrics from your local environment via "Remote Write."
* **Auth:** Use a Service Account (`aegis-agent`) with `roles/monitoring.metricWriter` and `roles/compute.admin`.
* **Output:** A `gcp-key.json` file used for both pushing metrics and allowing n8n to perform "Self-Healing" actions.
* **Alerting Policies:** 
    1. **Chaos Alert:** Monitors the custom metric `app_critical_alert > 0` to detect simulated resource spikes.
    2. **Downtime Alert:** Monitors the built-in Prometheus `up < 1` metric to detect complete container crashes.

## 2. Local: The Metric Producer
The heartbeat of the project is a containerized environment simulating a production service.
* **Node.js App:** A standard Express app using `prom-client` to expose metrics at `:3000/metrics`. It includes a "Chaos" endpoint to manually trigger resource spikes.
* **Prometheus Sidecar:** A local Prometheus instance configured in **Remote Write** mode.
* **The Flow:** App $\rightarrow$ Local Prometheus $\rightarrow$ GCP GMP (authenticated via `gcp-key.json`).

## 3. The Bridge: ngrok Tunnel
Because **n8n** runs on your local machine, GCP needs a secure path to send alerts back to you.
* **Action:** Execute `ngrok http 5678 --url=<YOUR_NGROK_DOMAIN>`.
* **Purpose:** Provides a persistent, static URL for the GCP **Notification Channel**. This ensures that if you restart your machine, the Cloud-to-Local connection remains intact.

## 4. n8n: The Brain Orchestrator
n8n acts as the "nervous system," connecting the alert to the AI and the final action.
* **Trigger:** **Webhook Node** listening at `/webhook/gcp-alert`.
* **Analysis:** **Ollama Node** (running Llama 3.1 8B locally).
    * *Prompt Logic:* "Analyze this JSON incident. Identify if it is a transient spike or a critical failure. Suggest a remediation."
* **Remediation:** A conditional branch. If the AI detects a "Critical" state, it uses the **Google Cloud Node** (via `gcp-key.json`) to restart the target instance or scale resources.

## 5. Slack: The Executive Notification
The final step is keeping the human-in-the-loop informed.
* **Action:** Integrate with the **Slack API**.
* **The Message:** > "🚨 **Aegis Alert**: Chaos Alert on `instance-01`.
    > 🤖 **AI Analysis**: Chaos alert gauge is set to 1.
    > ✅ **Action**: Service restarted successfully. View logs at [Link]."

---

## 🏗️ Technical Architecture


### Data Flow Path
$$\text{Local App} \xrightarrow{\text{Metrics}} \text{GCP (GMP)} \xrightarrow{\text{Alert Webhook}} \text{ngrok Tunnel} \xrightarrow{\text{n8n (Ollama AI)}} \xrightarrow{\text{Slack}} \text{User}$$

---

## 📅 Roadmap to MVP

| Phase | Task | Status |
| :--- | :--- | :--- |
| **Phase 1** | GCP IAM Setup & Service Account Key | ✅ Done |
| **Phase 2** | Local Docker (Node.js + Prometheus Remote Write) | ✅ Done |
| **Phase 3** | ngrok + n8n Webhook Connectivity | ✅ Done |
| **Phase 4** | Ollama Llama 3.1 Prompt Engineering | ✅ Done |
| **Phase 5** | Slack Notification Integration | ✅ Done |

---

## ⚠️ Risk Mitigation
* **Metric Latency:** Managed Prometheus has a slight delay. The Alerting Policy duration will be set to `60s` to avoid false positives.
* **Local Compute:** Running Ollama + n8n + Docker simultaneously requires significant RAM. Docker resource limits will be applied to the Node.js app to prevent "noisy neighbor" syndrome on the host machine.
* **Security:** `gcp-key.json` is strictly added to `.gitignore` and never committed to GitHub.
