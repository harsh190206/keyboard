import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';

type Props = {
    selected?: string;
    onSelect: (name: string) => void;
};

// Group products by category
const PRODUCT_CATEGORIES = {
    'Dairy Products': ['Butter', 'Cheese Fat', 'Cheese Lean', 'Curd', 'Margarine', 'Milk', 'Ice Cream', 'Dairy Mean Value'],
    'Fish & Seafood': ['Fish', 'Fish Mean Value', 'Sea Fish Fat', 'Sea Fish Lean', 'Sea Fish Smoked', 'Shell Fish', 'Salmon'],
    'Fruits': ['Pineapple', 'Pineapple (Frozen)', 'Apple', 'Apple (Frozen)', 'Apricots', 'Banana', 'Banana (Frozen)', 'Blueberries', 'Cherries', 'Cranberries', 'Grapes', 'Grapes (Frozen)', 'Mangoes', 'Fruit Mean Value', 'Melons', 'Melons (Honeydew)', 'Oranges', 'Papaya', 'Peaches', 'Pears', 'Plums', 'Strawberries', 'Strawberries (Frozen)'],
    'Vegetables': ['Asparagus', 'Beans', 'Beans (Frozen)', 'Beets', 'Broccoli', 'Brussels Sprouts', 'Cabbage', 'Carrots', 'Carrots (Frozen)', 'Cauliflower', 'Celery', 'Corn (Frozen)', 'Cucumber', 'Lettuce', 'Mushroom', 'Okra', 'Onions', 'Peas', 'Peas (Frozen)', 'Peppers (Sweet)', 'Potato', 'Potato (Frozen)', 'Roots', 'Sweet Corn', 'Sweet Potato', 'Tomatoes', 'Vegetables'],
    'Meat & Poultry': ['Meat', 'Pork', 'Chicken', 'Chicken (Lean)', 'Turkey', 'Pig Fat', 'Pig Lean'],
    'Other Foods': ['Beer', 'Bread', 'Bread (Frozen)', 'Chocolate', 'Cut Flowers', 'Dough', 'Dough (Frozen)', 'Eggs', 'Eggs (Frozen)', 'Pulses', 'Custom']
};

export const ProductPicker: React.FC<Props> = ({ selected = 'Custom', onSelect }) => {
    const [open, setOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const handleSelect = (name: string) => {
        setOpen(false);
        setSelectedCategory(null);
        onSelect(name);
    };

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
    };

    const handleBack = () => {
        setSelectedCategory(null);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Product</Text>

            <TouchableOpacity style={styles.selector} onPress={() => setOpen(true)}>
                <Text style={styles.selectorText}>{selected}</Text>
                <Text style={styles.selectorIcon}>▼</Text>
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
                    <Pressable style={styles.modalCard}>
                        {!selectedCategory ? (
                            // Category selection view
                            <>
                                <Text style={styles.modalTitle}>Select Product Category</Text>
                                <ScrollView style={styles.modalList}>
                                    {Object.keys(PRODUCT_CATEGORIES).map(category => (
                                        <TouchableOpacity
                                            key={category}
                                            style={styles.categoryOption}
                                            onPress={() => handleCategorySelect(category)}
                                        >
                                            <Text style={styles.categoryText}>{category}</Text>
                                            <Text style={styles.categoryIcon}>→</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        ) : (
                            // Product selection view
                            <>
                                <View style={styles.modalHeader}>
                                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                                        <Text style={styles.backIcon}>←</Text>
                                        <Text style={styles.backText}>Back</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.modalTitle}>{selectedCategory}</Text>
                                </View>
                                <ScrollView style={styles.modalList}>
                                    {PRODUCT_CATEGORIES[selectedCategory as keyof typeof PRODUCT_CATEGORIES]?.map(name => (
                                        <TouchableOpacity
                                            key={name}
                                            style={[styles.option, name === selected && styles.optionSelected]}
                                            onPress={() => handleSelect(name)}
                                        >
                                            <Text style={[styles.optionText, name === selected && styles.optionTextSelected]}>
                                                {name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 12, zIndex: 10 /* keep above other content */ },
    title: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 6 },
    selector: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectorText: { fontSize: 16, color: '#334155' },
    selectorIcon: { marginLeft: 12, color: '#64748b' },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 6,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    backIcon: {
        fontSize: 18,
        color: '#2563eb',
        marginRight: 4,
    },
    backText: {
        fontSize: 14,
        color: '#2563eb',
        fontWeight: '600',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        flex: 1,
    },
    modalList: { maxHeight: 380 },
    categoryOption: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    categoryText: {
        color: '#1e293b',
        fontSize: 16,
        fontWeight: '600'
    },
    categoryIcon: {
        color: '#64748b',
        fontSize: 18,
        fontWeight: 'bold'
    },
    option: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#ffffff',
    },
    optionSelected: { backgroundColor: '#eff6ff' },
    optionText: { color: '#334155', fontSize: 15 },
    optionTextSelected: { color: '#1d4ed8', fontWeight: '600' },
});
