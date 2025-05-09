import React from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';

interface ReportTableProps {
  reportData: any[];
  isInward: boolean;
  tableRef: React.RefObject<ScrollView>;
}

const ReportTable = ({reportData, isInward, tableRef}: ReportTableProps) => {
  return (
    <View style={styles.tableContainer}>
      <ScrollView
        ref={tableRef}
        horizontal={true}
        showsHorizontalScrollIndicator={true}>
        <ScrollView
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}>
          <View style={styles.tableWrapper}>
            <View style={[styles.tableHeader, {backgroundColor: '#f8f8f8'}]}>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    width: 40,
                    color: isInward ? '#F48221' : '#4682B4',
                  },
                ]}>
                #
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    width: 70,
                    color: isInward ? '#F48221' : '#4682B4',
                  },
                ]}>
                Unit
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    width: 100,
                    color: isInward ? '#F48221' : '#4682B4',
                  },
                ]}>
                {isInward ? 'Inward Date' : 'Outward Date'}
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    width: 100,
                    color: isInward ? '#F48221' : '#4682B4',
                  },
                ]}>
                {isInward ? 'Inward No' : 'Outward No'}
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    width: 150,
                    color: isInward ? '#F48221' : '#4682B4',
                  },
                ]}>
                Customer
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    width: 120,
                    color: isInward ? '#F48221' : '#4682B4',
                  },
                ]}>
                Vehicle
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    width: 80,
                    color: isInward ? '#F48221' : '#4682B4',
                  },
                ]}>
                Lot No
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    width: 150,
                    color: isInward ? '#F48221' : '#4682B4',
                  },
                ]}>
                Item Name
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    width: 100,
                    color: isInward ? '#F48221' : '#4682B4',
                    textAlign: 'center',
                  },
                ]}>
                Remark
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    width: 100,
                    color: isInward ? '#F48221' : '#4682B4',
                  },
                ]}>
                Item Mark
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    width: 80,
                    color: isInward ? '#F48221' : '#4682B4',
                  },
                ]}>
                Vakkal No
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    width: 60,
                    color: isInward ? '#F48221' : '#4682B4',
                  },
                ]}>
                Qty
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    width: 120,
                    color: isInward ? '#F48221' : '#4682B4',
                  },
                ]}>
                Delivered To
              </Text>
            </View>
            {reportData.map((item, index) => (
              <View
                key={`row-${index}`}
                style={[
                  styles.tableRow,
                  index % 2 === 0
                    ? {
                        backgroundColor: isInward ? '#FFF9F2' : '#F0F7FF',
                      }
                    : {backgroundColor: '#FFFFFF'},
                ]}>
                <Text
                  style={[styles.tableCell, {width: 40, fontWeight: 'bold'}]}>
                  {index + 1}
                </Text>
                <Text style={[styles.tableCell, {width: 70}]}>
                  {item.UNIT_NAME || '-'}
                </Text>
                <Text style={[styles.tableCell, {width: 100}]}>
                  {isInward
                    ? item.GRN_DATE
                      ? new Date(item.GRN_DATE).toLocaleDateString()
                      : '-'
                    : item.OUTWARD_DATE
                    ? new Date(item.OUTWARD_DATE).toLocaleDateString()
                    : '-'}
                </Text>
                <Text style={[styles.tableCell, {width: 100}]}>
                  {isInward ? item.GRN_NO || '-' : item.OUTWARD_NO || '-'}
                </Text>
                <Text style={[styles.tableCell, {width: 150}]}>
                  {item.CUSTOMER_NAME || '-'}
                </Text>
                <Text style={[styles.tableCell, {width: 120}]}>
                  {item.VEHICLE_NO || '-'}
                </Text>
                <Text style={[styles.tableCell, {width: 80}]}>
                  {item.LOT_NO || '-'}
                </Text>
                <Text style={[styles.tableCell, {width: 150}]}>
                  {item.ITEM_NAME || '-'}
                </Text>
                <Text
                  style={[styles.tableCell, {width: 100, textAlign: 'center'}]}>
                  {item.REMARK || '-'}
                </Text>
                <Text style={[styles.tableCell, {width: 100}]}>
                  {item.ITEM_MARK || '-'}
                </Text>
                <Text style={[styles.tableCell, {width: 80}]}>
                  {item.VAKKAL_NO || '-'}
                </Text>
                <Text style={[styles.tableCell, {width: 60}]}>
                  {item.QTY || '-'}
                </Text>
                <Text style={[styles.tableCell, {width: 120}]}>
                  {item.DELIVERED_TO || '-'}
                </Text>
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
    paddingHorizontal: 8,
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
});

export default ReportTable;
