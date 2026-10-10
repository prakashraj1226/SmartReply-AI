package com.smartreplyai.knowledgebase.dto;

import com.smartreplyai.knowledgebase.KnowledgeCategory;
import java.util.UUID;

public class KnowledgeCategoryDto {

    private UUID id;
    private String name;
    private int displayOrder;

    public KnowledgeCategoryDto() {
    }

    public static KnowledgeCategoryDto fromEntity(KnowledgeCategory c) {
        KnowledgeCategoryDto dto = new KnowledgeCategoryDto();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setDisplayOrder(c.getDisplayOrder());
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(int displayOrder) {
        this.displayOrder = displayOrder;
    }
}
