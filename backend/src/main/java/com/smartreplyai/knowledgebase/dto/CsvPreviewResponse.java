package com.smartreplyai.knowledgebase.dto;

import java.util.List;

public class CsvPreviewResponse {

    private int totalRows;
    private int validRows;
    private int duplicateRows;
    private int invalidRows;
    private List<CsvPreviewItem> items;

    public CsvPreviewResponse() {
    }

    public CsvPreviewResponse(int totalRows, int validRows, int duplicateRows, int invalidRows, List<CsvPreviewItem> items) {
        this.totalRows = totalRows;
        this.validRows = validRows;
        this.duplicateRows = duplicateRows;
        this.invalidRows = invalidRows;
        this.items = items;
    }

    public int getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(int totalRows) {
        this.totalRows = totalRows;
    }

    public int getValidRows() {
        return validRows;
    }

    public void setValidRows(int validRows) {
        this.validRows = validRows;
    }

    public int getDuplicateRows() {
        return duplicateRows;
    }

    public void setDuplicateRows(int duplicateRows) {
        this.duplicateRows = duplicateRows;
    }

    public int getInvalidRows() {
        return invalidRows;
    }

    public void setInvalidRows(int invalidRows) {
        this.invalidRows = invalidRows;
    }

    public List<CsvPreviewItem> getItems() {
        return items;
    }

    public void setItems(List<CsvPreviewItem> items) {
        this.items = items;
    }
}
