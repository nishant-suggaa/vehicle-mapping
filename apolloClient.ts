import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://capital-gecko-86.hasura.app/v1/graphql',
  cache: new InMemoryCache(),
  headers: {
    'x-hasura-admin-secret': 'KvwbAX6i0LilEx8XULsfRZHdjsOEZvRvB1tdUQ3ArdKMfIqW2esZPHfUisiOZBKu',
  },
});

export default client;