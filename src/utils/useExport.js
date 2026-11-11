import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../services/api";

/**
 * Exports Excel / PDF de l'espace membre.
 *
 * Une colonne : { label: "Montant", value: (ligne) => ..., pdf: (ligne) => ... }
 * `value` sert à l'Excel (nombre brut), `pdf` (facultatif) au texte affiché dans le PDF.
 */

let membreCache = null;

// Le membre est identifié par son matricule : il figure sur chaque document exporté.
export async function getMembreConnecte() {
  if (membreCache) return membreCache;
  try {
    const response = await api.get("/profiles");
    const user = (response.data || [])[0] || {};
    membreCache = {
      nom: user.membre ? `${user.membre.nom} ${user.membre.prenom}` : `${user.nom || ""} ${user.prenom || ""}`.trim(),
      matricule: user.membre?.matricule || "-",
    };
  } catch (e) {
    membreCache = { nom: "", matricule: "-" };
  }
  return membreCache;
}

// jsPDF (police Helvetica) n'affiche pas les espaces insécables de Intl en fr-FR.
const texte = (value) => String(value ?? "-").replace(/[  ]/g, " ");

export function formatMontant(value, devise = "FBU") {
  const n = parseFloat(value);
  if (isNaN(n)) return "-";
  return texte(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n)) + " " + devise;
}

export function formatDateExport(value) {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d) ? String(value) : d.toLocaleDateString("fr-FR");
}

const horodatage = () => new Date().toISOString().split("T")[0];

export function exportExcel({ fileName, sheetName = "Export", columns, rows }) {
  const data = rows.map((ligne) =>
    Object.fromEntries(columns.map((c) => [c.label, c.value(ligne) ?? ""])),
  );
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = columns.map((c) => ({ wch: Math.max(12, c.label.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${fileName}_${horodatage()}.xlsx`);
}

/**
 * PDF A4 : en-tête CASOMIREC, membre (nom + matricule), lignes de résumé facultatives,
 * puis un ou plusieurs tableaux ({ title, columns, rows }).
 */
export function exportPdf({ fileName, title, membre, summary = [], tables = [], orientation = "portrait" }) {
  const doc = new jsPDF({ orientation });
  const marge = 14;

  doc.setFontSize(16);
  doc.setTextColor(13, 110, 253);
  doc.text("CASOMIREC - Caisse sociale", marge, 18);
  doc.setTextColor(0);
  doc.setFontSize(13);
  doc.text(texte(title), marge, 27);

  doc.setFontSize(10);
  let y = 35;
  if (membre) {
    doc.text(texte(`Membre : ${membre.nom}`), marge, y);
    doc.text(texte(`Matricule : ${membre.matricule}`), marge, y + 5);
    y += 10;
  }
  doc.text(`Édité le ${new Date().toLocaleDateString("fr-FR")}`, marge, y);
  y += 8;

  summary.forEach(([label, value]) => {
    doc.text(texte(`${label} : ${value}`), marge, y);
    y += 5;
  });

  tables.forEach((table) => {
    if (table.title) {
      y += 3;
      doc.setFontSize(11);
      doc.text(texte(table.title), marge, y);
      doc.setFontSize(10);
      y += 2;
    }
    autoTable(doc, {
      startY: y + 2,
      head: [table.columns.map((c) => c.label)],
      body: table.rows.length
        ? table.rows.map((ligne) => table.columns.map((c) => texte((c.pdf || c.value)(ligne))))
        : [[{ content: "Aucune donnée", colSpan: table.columns.length, styles: { halign: "center" } }]],
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [13, 110, 253] },
    });
    y = doc.lastAutoTable.finalY + 8;
  });

  doc.save(`${fileName}_${horodatage()}.pdf`);
}

/**
 * Relevé de situation financière d'un membre (section 7.3) : résumé, périodes de cotisation
 * non enregistrées et échéancier de chaque crédit en cours.
 * `situation` vient de /dashboard-member ou /membres/{id}/situation ; `credits` sont les
 * détails /credits/{id} (avec leurs remboursements).
 */
export function exportReleveSituation(situation, credits = []) {
  const s = situation.stats;
  const echeanceColumns = [
    { label: "N°", value: (e) => e.numero_echeance },
    { label: "Date d'échéance", value: (e) => formatDateExport(e.date_echeance) },
    { label: "Montant prévu", value: (e) => formatMontant(e.montant_prevu) },
    { label: "Montant payé", value: (e) => formatMontant(e.montant_paye) },
    { label: "Statut", value: (e) => String(e.statut).replace(/_/g, " ") },
  ];

  exportPdf({
    fileName: `releve_situation_${situation.membre.matricule}`,
    title: "Relevé de situation financière",
    membre: situation.membre,
    summary: [
      ["Cotisations versées", formatMontant(s.cotisationsTotal)],
      ["Restant dû sur crédits", formatMontant(s.creditsEnCours)],
      ["Déjà remboursé", formatMontant(s.creditsTotalPaye)],
      [
        "Prochaine échéance",
        s.prochaineEcheance
          ? `${formatMontant(s.prochaineEcheance.montant)} le ${formatDateExport(s.prochaineEcheance.date)}`
          : "Aucune",
      ],
      ["Assistances reçues", formatMontant(s.montantsAssistancesRecus)],
      ["Échéances en retard", s.echeancesEnRetard],
    ],
    tables: [
      {
        title: "Cotisations non enregistrées (12 derniers mois)",
        columns: [
          { label: "Période", value: (p) => p.periode },
          { label: "Du", value: (p) => formatDateExport(p.debut) },
          { label: "Au", value: (p) => formatDateExport(p.fin) },
        ],
        rows: s.periodesNonPayees || [],
      },
      ...credits.map((c) => ({
        title: `Échéancier du crédit n° ${c.id} (${formatMontant(c.montant_accorde)}, restant ${formatMontant(c.montant_restant)})`,
        columns: echeanceColumns,
        rows: [...(c.remboursements || [])].sort((a, b) => a.numero_echeance - b.numero_echeance),
      })),
    ],
  });
}

/** Détails (avec échéancier) des crédits encore en remboursement parmi `credits`. */
export async function chargerCreditsEnCours(credits) {
  const enCours = credits.filter(
    (c) => parseFloat(c.montant_restant) > 0 && ["approuve", "en_cours"].includes(c.statut) && c.date_approbation !== null,
  );
  return Promise.all(enCours.map((c) => api.get(`/credits/${c.id}`).then((r) => r.data)));
}

