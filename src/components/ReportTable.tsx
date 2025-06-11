import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface ReportTableProps {
  reportData: any[];
  isInward: boolean;
  tableRef: React.RefObject<ScrollView>;
  onInwardOutwardNoPress?: (item: any) => void;
}

const ReportTable = ({
  reportData,
  isInward,
  tableRef,
  onInwardOutwardNoPress,
}: ReportTableProps) => {
  // Define column widths as constants to ensure consistency
  const columnWidths = {
    number: 65,
    unit: 70,
    date: 100,
    inwardOutwardNo: 100,
    customer: 150,
    vehicle: 100,
    lotNo: 80,
    itemName: 150,
    remark: 100,
    itemMark: 120,
    vakkalNo: 110,
    qty: 60,
    deliveredTo: 120,
  };

  // Helper function for theme colors
  const getThemeColor = () => (isInward ? '#F48221' : '#4682B4');

  // Helper function to format date to dd/mm/yy
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);

      return `${day}/${month}/${year}`;
    } catch (error) {
      return '-';
    }
  };

  return (
    <View style={styles.tableContainer}>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.headerScrollView}>
        <View style={[styles.tableHeader, {backgroundColor: '#f8f8f8'}]}>
          <Text
            style={[
              styles.tableHeaderCell,
              {width: columnWidths.number, color: getThemeColor()},
            ]}>
            Sr.No
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              {width: columnWidths.unit, color: getThemeColor()},
            ]}>
            Unit
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              {width: columnWidths.date, color: getThemeColor()},
            ]}>
            {isInward ? 'Inward Date' : 'Outward Date'}
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              {width: columnWidths.inwardOutwardNo, color: getThemeColor()},
            ]}>
            {isInward ? 'Inward No' : 'Outward No'}
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              {width: columnWidths.lotNo, color: getThemeColor()},
            ]}>
            Lot No
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              {width: columnWidths.itemName, color: getThemeColor()},
            ]}>
            Item Name
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              {width: columnWidths.vakkalNo, color: getThemeColor()},
            ]}>
            Vakkal No
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              {width: columnWidths.itemMark, color: getThemeColor()},
            ]}>
            Item Mark
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              {width: columnWidths.qty, color: getThemeColor()},
            ]}>
            Qty
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              {width: columnWidths.remark, color: getThemeColor()},
            ]}>
            Remark
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              {width: columnWidths.vehicle, color: getThemeColor()},
            ]}>
            Vehicle
          </Text>
          {/* Show Delivered To column only for Outward */}
          {!isInward && (
            <Text
              style={[
                styles.tableHeaderCell,
                {width: columnWidths.deliveredTo, color: getThemeColor()},
              ]}>
              Delivered To
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Scrollable Content */}
      <ScrollView
        ref={tableRef}
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        style={styles.contentScrollView}>
        <ScrollView
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}>
          <View style={styles.tableWrapper}>
            {/* Table Rows */}
            {reportData.map((item, index) => (
              <View
                key={`row-${index}`}
                style={[
                  styles.tableRow,
                  {
                    backgroundColor:
                      index % 2 === 0
                        ? isInward
                          ? '#FFF9F2'
                          : '#F0F7FF'
                        : '#FFFFFF',
                  },
                ]}>
                <Text style={[styles.tableCell, {width: columnWidths.number}]}>
                  {index + 1}
                </Text>
                <Text style={[styles.tableCell, {width: columnWidths.unit}]}>
                  {item.UNIT_NAME || '-'}
                </Text>
                <Text style={[styles.tableCell, {width: columnWidths.date}]}>
                  {isInward
                    ? formatDate(item.GRN_DATE)
                    : formatDate(item.OUTWARD_DATE)}
                </Text>

                {isInward ? (
                  <TouchableOpacity
                    style={[
                      styles.tableCellContainer,
                      {width: columnWidths.inwardOutwardNo},
                    ]}
                    onPress={() =>
                      onInwardOutwardNoPress && onInwardOutwardNoPress(item)
                    }
                    disabled={!(onInwardOutwardNoPress && item.GRN_NO)}>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.clickableCell,
                        {
                          color:
                            onInwardOutwardNoPress && item.GRN_NO
                              ? getThemeColor()
                              : '#334155',
                          width: '100%',
                        },
                      ]}>
                      {item.GRN_NO || '-'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text
                    style={[
                      styles.tableCell,
                      {width: columnWidths.inwardOutwardNo},
                    ]}>
                    {item.OUTWARD_NO || '-'}
                  </Text>
                )}

                <Text style={[styles.tableCell, {width: columnWidths.lotNo}]}>
                  {item.LOT_NO || '-'}
                </Text>
                <Text
                  style={[styles.tableCell, {width: columnWidths.itemName}]}>
                  {item.ITEM_NAME || '-'}
                </Text>
                <Text
                  style={[styles.tableCell, {width: columnWidths.vakkalNo}]}>
                  {item.VAKKAL_NO || '-'}
                </Text>
                <Text
                  style={[styles.tableCell, {width: columnWidths.itemMark}]}>
                  {item.ITEM_MARK || '-'}
                </Text>
                <Text style={[styles.tableCell, {width: columnWidths.qty}]}>
                  {item.QTY || '-'}
                </Text>
                <Text style={[styles.tableCell, {width: columnWidths.remark}]}>
                  {item.REMARK || '-'}
                </Text>
                <Text style={[styles.tableCell, {width: columnWidths.vehicle}]}>
                  {item.VEHICLE_NO || '-'}
                </Text>
                {/* Show Delivered To column only for Outward */}
                {!isInward && (
                  <Text
                    style={[
                      styles.tableCell,
                      {width: columnWidths.deliveredTo},
                    ]}>
                    {item.DELIVERED_TO || '-'}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    margin: 0,
    borderRadius: 0,
  },
  headerScrollView: {
    maxHeight: 50,
  },
  contentScrollView: {
    flex: 1,
  },
  tableWrapper: {
    flexDirection: 'column',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  tableHeaderCell: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableCell: {
    fontSize: 14,
    color: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
    textAlign: 'center',
  },
  tableCellContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  clickableCell: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});

export default ReportTable;