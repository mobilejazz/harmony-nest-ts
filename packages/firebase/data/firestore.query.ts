import firebase from 'firebase/app';
import { PaginationQuery, Query } from '@mobilejazz/harmony-core';

export class FirestoreCreateDocumentQuery extends Query {}

export class FirestoreIncrementQuery extends Query {
    constructor(readonly field: string, readonly amount: number) {
        super();
    }
}

export class FirestoreWhereClause {
    constructor(
        readonly fieldPath: string | firebase.firestore.FieldPath,
        readonly opStr: firebase.firestore.WhereFilterOp,
        readonly value: any,
    ) {}
}

export type FirestoreFilter = FirestoreWhereClause[];

export interface FirestoreOrder {
    field: string;
    direction?: 'asc' | 'desc';
}

export class FirestorePaginationNextQuery extends PaginationQuery {
    constructor(
        readonly page: number,
        readonly size: number,
        readonly filterBy: FirestoreFilter,
        readonly orderBy: FirestoreOrder,
        readonly lastDoc: firebase.firestore.DocumentSnapshot,
    ) {
        super();
    }
}

export class FirestorePaginationPreviousQuery extends PaginationQuery {
    constructor(
        readonly page: number,
        readonly size: number,
        readonly filterBy: FirestoreFilter,
        readonly orderBy: FirestoreOrder,
        readonly firstDoc: firebase.firestore.DocumentSnapshot,
    ) {
        super();
    }
}
