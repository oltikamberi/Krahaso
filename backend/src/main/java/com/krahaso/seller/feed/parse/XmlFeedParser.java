package com.krahaso.seller.feed.parse;

import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Format-agnostic XML reader. Instead of expecting one schema it finds the
 * repeated element that represents a product (`<product>`, `<item>`, whatever the
 * seller uses) and flattens its children into fields. Namespace prefixes are
 * ignored, so Google Merchant style `g:price` maps to `price`.
 */
@Component
public class XmlFeedParser implements FeedParser {

    @Override
    public boolean supports(String filename, String contentType) {
        String name = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        String type = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        return name.endsWith(".xml") || name.endsWith(".rss") || type.contains("xml");
    }

    @Override
    public List<FeedRow> parse(byte[] content) {
        Document document = readDocument(content);

        List<Element> records = findRecordElements(document);
        List<FeedRow> rows = new ArrayList<>(records.size());
        int rowNumber = 0;
        for (Element record : records) {
            rowNumber++;
            rows.add(FeedFieldMapper.toRow(rowNumber, flatten(record)));
        }
        return rows;
    }

    private Document readDocument(byte[] content) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            // Seller-supplied XML is untrusted: no DTDs, no external entities (XXE)
            factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
            factory.setExpandEntityReferences(false);
            factory.setNamespaceAware(false);

            Document document = factory.newDocumentBuilder().parse(new ByteArrayInputStream(content));
            document.getDocumentElement().normalize();
            return document;
        } catch (Exception malformed) {
            throw new IllegalArgumentException("XML-i nuk lexohet: " + malformed.getMessage(), malformed);
        }
    }

    /**
     * The product element is the most frequently repeated element that itself has
     * child elements holding text.
     */
    private List<Element> findRecordElements(Document document) {
        Map<String, List<Element>> byName = new LinkedHashMap<>();
        collect(document.getDocumentElement(), byName);

        return byName.values().stream()
                .max((left, right) -> Integer.compare(left.size(), right.size()))
                .orElseGet(List::of);
    }

    private void collect(Element element, Map<String, List<Element>> byName) {
        NodeList children = element.getChildNodes();
        boolean hasElementChildWithText = false;

        for (int i = 0; i < children.getLength(); i++) {
            Node child = children.item(i);
            if (child.getNodeType() != Node.ELEMENT_NODE) {
                continue;
            }
            Element childElement = (Element) child;
            if (!textOf(childElement).isBlank() || hasElementChild(childElement)) {
                hasElementChildWithText = true;
            }
            collect(childElement, byName);
        }

        if (hasElementChildWithText) {
            byName.computeIfAbsent(localName(element), ignored -> new ArrayList<>()).add(element);
        }
    }

    /** Child element names become field names; one nested level is flattened too. */
    private Map<String, String> flatten(Element record) {
        Map<String, String> fields = new LinkedHashMap<>();
        NodeList children = record.getChildNodes();

        for (int i = 0; i < children.getLength(); i++) {
            Node child = children.item(i);
            if (child.getNodeType() != Node.ELEMENT_NODE) {
                continue;
            }
            Element element = (Element) child;
            if (hasElementChild(element)) {
                NodeList nested = element.getChildNodes();
                for (int j = 0; j < nested.getLength(); j++) {
                    Node grandchild = nested.item(j);
                    if (grandchild.getNodeType() == Node.ELEMENT_NODE) {
                        fields.putIfAbsent(localName((Element) grandchild), textOf((Element) grandchild));
                    }
                }
            } else {
                fields.putIfAbsent(localName(element), textOf(element));
            }
        }
        return fields;
    }

    private boolean hasElementChild(Element element) {
        NodeList children = element.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            if (children.item(i).getNodeType() == Node.ELEMENT_NODE) {
                return true;
            }
        }
        return false;
    }

    private String localName(Element element) {
        String tag = element.getTagName();
        int colon = tag.indexOf(':');
        return colon >= 0 ? tag.substring(colon + 1) : tag;
    }

    private String textOf(Element element) {
        NodeList children = element.getChildNodes();
        StringBuilder text = new StringBuilder();
        for (int i = 0; i < children.getLength(); i++) {
            Node child = children.item(i);
            if (child.getNodeType() == Node.TEXT_NODE || child.getNodeType() == Node.CDATA_SECTION_NODE) {
                text.append(child.getNodeValue());
            }
        }
        return text.toString().trim();
    }
}
