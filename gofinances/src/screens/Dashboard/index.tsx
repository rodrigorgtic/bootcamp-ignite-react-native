import React, { useState, useEffect, useCallback } from 'react'
import { ActivityIndicator } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { useFocusEffect  } from '@react-navigation/native'
import { useTheme } from 'styled-components';
import { useAuth } from '../../hooks/auth'

import { Card } from '../../components/Card/index';
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard';
import { 
  Container,
  Header,
  UserWrapper,
  UserInfo,
  Photo,
  User,
  UserGreeting,
  UserName,
  Icon,
  CardsContainer,
  Transactions,
  TransactionList,
  Title,
  LogoutButton,
  LoadContainer,
} from './styles'

export interface DataListProps extends TransactionCardProps {
  id: string;
}

interface CardProps {
  amount: string;
  lastTransaction: string;
}

interface CardData {
  income: CardProps;
  outcome: CardProps;
  total: CardProps;
}

export function Dashboard() {
  const theme = useTheme()
  const { signOut, user } = useAuth()
  const [isLoading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<DataListProps[]>([]);
  const [cardData, setCardData] = useState<CardData>({} as CardData);

  function getLastTransactionDate(
    collection: DataListProps[],
    type: 'income' | 'outcome'
  ) {

    const collectionFiltered = collection
      .filter(transaction => transaction.type === type)

    if (collectionFiltered.length === 0) 
      return 0

    const lastTransaction = new Date(
      Math.max.apply(Math, collectionFiltered
        .map(transaction => new Date(transaction.date).getTime())));

    return `${lastTransaction.getDate()} de ${lastTransaction
      .toLocaleString('pt-BR', {
      month: 'long'
    })}`
  }

  async function loadTransactions() {
    const dataKey = `@gofinances:transactions_user:${user.id}`
    const response = await AsyncStorage.getItem(dataKey);
    const currentTransactions = response ? JSON.parse(response) : [];

    let incomeTotal = 0;
    let outcomeTotal = 0;

    const formattedTransactions: DataListProps[] = currentTransactions.map((transaction: DataListProps) => {

      if (transaction.type === 'income') {
        incomeTotal += Number(transaction.amount);
      } else {
        outcomeTotal += Number(transaction.amount);
      }

      const amount = Number(transaction.amount)
        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      const formattedDate = Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(transaction.date));

      return {
        ...transaction,
        amount,
        date: formattedDate,
      }
    })

    setTransactions(formattedTransactions);
    
    const lastIncome = getLastTransactionDate(currentTransactions, 'income')
    const lastOutcome = getLastTransactionDate(currentTransactions, 'outcome')
    const totalInterval = lastOutcome === 0 ? '' : `01 á ${lastOutcome}`
    
    setCardData({
      income: {
        amount: incomeTotal.toLocaleString('pt-BR', { 
          style: 'currency', 
          currency: 'BRL',
        }),
        lastTransaction: lastIncome === 0 ? 'Nenhuma entrada' : `Última entrada dia ${lastIncome}`,
      },
      outcome: {
        amount: outcomeTotal.toLocaleString('pt-BR', { 
          style: 'currency', 
          currency: 'BRL',
        }),
        lastTransaction: lastOutcome === 0 ? 'Nenhuma saída' : `Última saída dia ${lastOutcome}`,
      },
      total: {
        amount: (incomeTotal - outcomeTotal).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        lastTransaction: totalInterval,
      },
    })

    setLoading(false)
  }

  useEffect(() => {
    loadTransactions();
  },[]);

  useFocusEffect(useCallback(() => {
    loadTransactions();
  }, []));

  return (
    <Container>
      {isLoading ? (
        <LoadContainer>
          <ActivityIndicator color={theme.colors.secondary} size="large" />
        </LoadContainer>
      ) : (
        <>
          <Header>
            <UserWrapper>
              <UserInfo>
                <Photo source={{ uri: user.photo }} />
                <User>
                  <UserGreeting>Olá,</UserGreeting>
                  <UserName>{user.name}</UserName>
                </User>
              </UserInfo>
              <LogoutButton onPress={signOut}>
                <Icon name="power" />
              </LogoutButton>
            </UserWrapper>
          </Header>

          <CardsContainer>
            <Card
              type="income"
              title="Entradas"
              amount={cardData.income.amount}
              lastTransaction={cardData.income.lastTransaction}
            />
            <Card
              type="outcome"
              title="Saídas"
              amount={cardData.outcome.amount}
              lastTransaction={cardData.outcome.lastTransaction}
            />
            <Card
              type="total"
              title="Total"
              amount={cardData.total.amount}
              lastTransaction={cardData.total.lastTransaction}
            />
          </CardsContainer>

          <Transactions>
            <Title>Listagem</Title>

            <TransactionList 
              data={transactions}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <TransactionCard data={item} />}
            />
          </Transactions>
        </>
      )}
    </Container>
  )
}
