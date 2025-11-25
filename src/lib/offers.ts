
import type { AffiliateOffer } from './data';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function useAffiliateOfferById(id: string | undefined) {
    const { firestore } = useFirebase();
    const offerRef = useMemoFirebase(
        () => (firestore && id ? doc(firestore, 'affiliateOffers', id) : null),
        [firestore, id]
    );
    return useDoc<AffiliateOffer>(offerRef);
}
