package com.eval.backend.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class PdfService {

    private static final Font TITLE_FONT = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD, BaseColor.BLUE);
    private static final Font SUBTITLE_FONT = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, BaseColor.DARK_GRAY);
    private static final Font NORMAL_FONT = new Font(Font.FontFamily.HELVETICA, 11, Font.NORMAL, BaseColor.BLACK);
    private static final Font BOLD_FONT = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.BLACK);
    private static final Font HEADER_FONT = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, BaseColor.WHITE);

    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("dd/MM/yyyy HH:mm");

    public byte[] generateTicketPdf(Map<String, Object> ticket, List<Map<String, Object>> history) throws Exception {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);

        document.open();

        // Add header
        addHeader(document, ticket);

        // Add ticket details
        addTicketDetails(document, ticket);

        // Add description
        addDescription(document, ticket);

        // Add history
        addHistory(document, history);

        document.close();
        return out.toByteArray();
    }

    private void addHeader(Document document, Map<String, Object> ticket) throws Exception {
        Paragraph header = new Paragraph("Détails du Ticket", TITLE_FONT);
        header.setAlignment(Element.ALIGN_CENTER);
        document.add(header);

        document.add(Chunk.NEWLINE);
    }

    private void addTicketDetails(Document document, Map<String, Object> ticket) throws Exception {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10f);
        table.setSpacingAfter(10f);

        addTableRow(table, "ID Ticket", getStringValue(ticket, "id"));
        addTableRow(table, "Titre", getStringValue(ticket, "name"));
        addTableRow(table, "Statut", getStatusLabel(ticket.get("status")));
        addTableRow(table, "Priorité", getPriorityLabel(ticket.get("priority")));
        addTableRow(table, "Date de création", formatDate(ticket.get("date_creation")));
        addTableRow(table, "Dernière modification", formatDate(ticket.get("date_mod")));
        addTableRow(table, "Date d'ouverture", formatDate(ticket.get("date")));

        document.add(table);
    }

    private void addDescription(Document document, Map<String, Object> ticket) throws Exception {
        Paragraph subtitle = new Paragraph("Description", SUBTITLE_FONT);
        document.add(subtitle);

        String content = getStringValue(ticket, "content");
        Paragraph description = new Paragraph(content != null ? content : "—", NORMAL_FONT);
        description.setSpacingAfter(15f);
        document.add(description);
    }

    private void addHistory(Document document, List<Map<String, Object>> history) throws Exception {
        if (history == null || history.isEmpty()) return;

        Paragraph subtitle = new Paragraph("Historique des modifications", SUBTITLE_FONT);
        document.add(subtitle);
        document.add(Chunk.NEWLINE);

        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setSpacingBefore(5f);

        // Header row
        addTableHeaderCell(table, "Date");
        addTableHeaderCell(table, "Ancien statut");
        addTableHeaderCell(table, "Nouveau statut");
        addTableHeaderCell(table, "Commentaire");

        for (Map<String, Object> entry : history) {
            addTableCell(table, formatDate(entry.get("changedAt")));
            addTableCell(table, getStatusLabel(entry.get("oldStatus")));
            addTableCell(table, getStatusLabel(entry.get("newStatus")));
            
            String comment = getStringValue(entry, "comment");
            if (comment == null || comment.trim().isEmpty()) {
                comment = getStringValue(entry, "solution");
            }
            addTableCell(table, comment != null ? comment : "—");
        }

        document.add(table);
    }

    private void addTableRow(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label + ":", BOLD_FONT));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(5f);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value != null ? value : "—", NORMAL_FONT));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(5f);
        table.addCell(valueCell);
    }

    private void addTableHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, HEADER_FONT));
        cell.setBackgroundColor(BaseColor.GRAY);
        cell.setPadding(8f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private void addTableCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "—", NORMAL_FONT));
        cell.setPadding(6f);
        table.addCell(cell);
    }

    private String getStringValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? String.valueOf(value) : null;
    }

    private String formatDate(Object dateObj) {
        if (dateObj == null) return "—";
        try {
            if (dateObj instanceof Date) {
                return DATE_FORMAT.format((Date) dateObj);
            }
            // Parse from string if needed
            return String.valueOf(dateObj);
        } catch (Exception e) {
            return "—";
        }
    }

    private String getStatusLabel(Object status) {
        if (status == null) return "—";
        int s = status instanceof Integer ? (Integer) status : Integer.parseInt(status.toString());
        return switch (s) {
            case 1 -> "Nouveau";
            case 2 -> "En cours (Attribué)";
            case 3 -> "Planifié";
            case 4 -> "En attente";
            case 5 -> "Résolu";
            case 6 -> "Clos";
            default -> "Inconnu (" + s + ")";
        };
    }

    private String getPriorityLabel(Object priority) {
        if (priority == null) return "—";
        int p = priority instanceof Integer ? (Integer) priority : Integer.parseInt(priority.toString());
        return switch (p) {
            case 1 -> "Très basse";
            case 2 -> "Basse";
            case 3 -> "Moyenne";
            case 4 -> "Haute";
            case 5 -> "Très haute";
            case 6 -> "Majeure";
            default -> "Inconnu (" + p + ")";
        };
    }
}
